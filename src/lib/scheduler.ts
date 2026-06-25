import { prisma } from "./db";
import { calculateSafetyDelay } from "./utils";
import whatsappService from "./whatsapp";
import { getCampaignService } from "./CampaignService";
import { getQueueService } from "./QueueService";
import { logger } from "./logger";


const IDLE_SLEEP_MS = 2000;
const OFFLINE_SLEEP_MS = 10000;
const CLAIM_CONFLICT_BACKOFF_MS = 25;
const CLAIM_MAX_ATTEMPTS = 20;
const OFFLINE_LOG_INTERVAL_MS = 30000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function claimNextScheduledMessage(now: Date) {
  for (let attempt = 0; attempt < CLAIM_MAX_ATTEMPTS; attempt++) {
    const candidate = await prisma.scheduledMessage.findFirst({
      where: { status: "PENDING", scheduledFor: { lte: now } },
      orderBy: { scheduledFor: "asc" },
      include: { template: true },
    });

    if (!candidate) {
      return null;
    }

    const claimResult = await prisma.scheduledMessage.updateMany({
      where: { id: candidate.id, status: "PENDING" },
      data: { status: "PROCESSING" },
    });

    if (claimResult.count > 0) {
      return candidate;
    }

    await sleep(CLAIM_CONFLICT_BACKOFF_MS);
  }

  return null;
}

export function startScheduler() {
  const globalObj = global as unknown as { isSchedulerRunning?: boolean; wakeUpScheduler?: () => void };
  if (globalObj.isSchedulerRunning) {
    return;
  }
  globalObj.isSchedulerRunning = true;

  logger.info("[Scheduler] Background Worker started.");

  let workerTimeout: NodeJS.Timeout | null = null;
  let isProcessing = false;
  let lastOfflineLogAt = 0;

  async function workerLoop() {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const queueLogs = getQueueService();
      const status = whatsappService.getStatus();

      if (!status.isReady) {
        const nowMs = Date.now();
        if (nowMs - lastOfflineLogAt >= OFFLINE_LOG_INTERVAL_MS) {
          logger.warn(`[Scheduler] WhatsApp not ready (Status: ${status.status} - Auth: ${status.isAuthenticated}). Sleeping 10s...`);
          queueLogs.pushLog("WhatsApp desconectado. Aguardando reconexao...", "warning");
          lastOfflineLogAt = nowMs;
        }

        workerTimeout = setTimeout(workerLoop, OFFLINE_SLEEP_MS);
        return;
      }

      const msg = await claimNextScheduledMessage(new Date());
      if (!msg) {
        workerTimeout = setTimeout(workerLoop, IDLE_SLEEP_MS);
        return;
      }

      let success = false;
      try {
        const mediaData = msg.template.media ? JSON.parse(msg.template.media as string) : undefined;
        await whatsappService.sendMessage(msg.contactPhone, msg.template.content, mediaData, { fallbackName: msg.contactName });
        success = true;
        queueLogs.pushLog(`Enviado para ${msg.contactName}`, "success");
      } catch (error: unknown) {
        logger.error({ err: error, phone: msg.contactPhone }, `[Scheduler] Error sending to contact`);
        queueLogs.pushLog(`Erro ao enviar para ${msg.contactName}`, "error");
      }

      if (msg.batchId) {
        await prisma.$transaction([
          prisma.scheduledMessage.update({
            where: { id: msg.id },
            data: { status: success ? "SENT" : "FAILED" },
          }),
          prisma.campaign.updateMany({
            where: { id: msg.batchId },
            data: success ? { sentCount: { increment: 1 } } : { failedCount: { increment: 1 } },
          }),
        ]);

        const campaignService = getCampaignService();
        const pendingLeft = await prisma.scheduledMessage.count({
          where: { batchId: msg.batchId, status: { in: ["PENDING", "PROCESSING", "PAUSED"] } },
        });

        if (pendingLeft === 0) {
          const tmpCamp = await prisma.campaign.findUnique({ where: { id: msg.batchId } });
          if (tmpCamp) {
            const camp = await campaignService.completeCampaignIfOpen(msg.batchId, {
              sentCount: tmpCamp.sentCount,
              failedCount: tmpCamp.failedCount,
            });

            if (camp) {
              void (async () => {
                try {
                  const { getReportService } = await import("./ReportService");
                  const reportService = getReportService();
                  const config = await reportService.getConfig();

                  if (config?.sendImmediate && !camp.immediateReportSentAt) {
                    const reportMessage = reportService.formatImmediateReport(camp);
                    const chartUrl = reportService.getImmediateChartUrl(camp);
                    const result = await reportService.sendReportToAllRecipients(whatsappService, reportMessage, chartUrl);
                    if (result.success || result.sentTo.length > 0) {
                      await campaignService.markImmediateReportSentIfPending(camp.id);
                    }
                  }
                } catch (reportError) {
                  logger.error({ err: reportError }, "[Scheduler] Immediate report error");
                }
              })();
            }
          }
        }
      } else {
        await prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: { status: success ? "SENT" : "FAILED" },
        });
      }

      const delay = Math.max(1000, calculateSafetyDelay());
      workerTimeout = setTimeout(workerLoop, delay);
    } catch (error) {
      logger.error({ err: error }, "[Scheduler] Worker loop error");
      workerTimeout = setTimeout(workerLoop, 5000);
    } finally {
      isProcessing = false;
    }
  }

  globalObj.wakeUpScheduler = () => {
    if (workerTimeout) clearTimeout(workerTimeout);
    if (!isProcessing) workerLoop();
  };

  void (async () => {
    try {
      const res = await prisma.scheduledMessage.updateMany({
        where: {
          status: { in: ["PENDING", "PROCESSING"] },
          scheduledFor: { lte: new Date(Date.now() - 15 * 60 * 1000) },
        },
        data: { status: "PAUSED" },
      });

      if (res.count > 0) {
        logger.info(`[Scheduler] Suspensas ${res.count} mensagens antigas (PAUSED) por prevencao.`);
      }
    } catch (error) {
      logger.error({ err: error }, "[Scheduler] Erro ao suspender mensagens");
    } finally {
      workerLoop();
    }
  })();
}
