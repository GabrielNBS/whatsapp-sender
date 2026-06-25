import { Contact } from "./types";
import { prisma } from "./db";
import { SYSTEM_TEMPLATE_CATEGORY } from "@/constants/domain";
import { SchedulerService } from "@/server/services/SchedulerService";

class QueueService {
  private activeCampaignId: string | null = null;
  private abortSignal = false;
  private isInitializing = false;
  private operationLock: Promise<void> = Promise.resolve();
  private logs: { message: string; type: "info" | "success" | "warning" | "error"; timestamp: number }[] = [];
  private totalLogs = 0;

  private static readonly MAX_FAILED_CONTACTS = 200;

  private addLog(message: string, type: "info" | "success" | "warning" | "error" = "info") {
    this.logs.push({ message, type, timestamp: Date.now() });
    this.totalLogs++;
    if (this.logs.length > 500) this.logs.shift();
  }

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const previous = this.operationLock;
    let release: (() => void) | undefined;
    this.operationLock = new Promise((resolve) => {
      release = resolve;
    });

    await previous;
    try {
      return await fn();
    } finally {
      release?.();
    }
  }

  public async getStatus(logOffset: number = 0) {
    if (this.isInitializing) {
      return {
        isSending: true,
        isPaused: false,
        progress: 0,
        currentContactIndex: 0,
        totalContacts: 0,
        statusMessage: "Iniciando transmissao no servidor...",
        failedContacts: [],
        sentCount: 0,
        failedCount: 0,
        logs: logOffset < this.totalLogs ? this.logs.slice(Math.max(0, this.logs.length - (this.totalLogs - logOffset))) : [],
        totalLogs: this.totalLogs,
        failedContactsTotal: 0,
        failedContactsTruncated: false,
      };
    }

    if (!this.activeCampaignId) {
      const activeBatch = await prisma.scheduledMessage.findFirst({
        where: { status: { in: ["PENDING", "PROCESSING", "PAUSED"] }, batchId: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { batchId: true },
      });

      if (!activeBatch?.batchId) {
        return {
          isSending: false,
          isPaused: false,
          progress: 100,
          logs: [],
          failedContacts: [],
          failedContactsTotal: 0,
          failedContactsTruncated: false,
        };
      }

      this.activeCampaignId = activeBatch.batchId;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: this.activeCampaignId },
    });

    if (!campaign) {
      this.activeCampaignId = null;
      return {
        isSending: false,
        isPaused: false,
        progress: 100,
        logs: [],
        failedContacts: [],
        failedContactsTotal: 0,
        failedContactsTruncated: false,
      };
    }

    const [pendingCount, activePendingCount, processingCount, pausedCount, failedCountTotal, failedRecords] = await Promise.all([
      prisma.scheduledMessage.count({ where: { batchId: this.activeCampaignId, status: "PENDING" } }),
      prisma.scheduledMessage.count({
        where: { batchId: this.activeCampaignId, status: "PENDING", scheduledFor: { lte: new Date() } },
      }),
      prisma.scheduledMessage.count({ where: { batchId: this.activeCampaignId, status: "PROCESSING" } }),
      prisma.scheduledMessage.count({ where: { batchId: this.activeCampaignId, status: "PAUSED" } }),
      prisma.scheduledMessage.count({ where: { batchId: this.activeCampaignId, status: "FAILED" } }),
      prisma.scheduledMessage.findMany({
        where: { batchId: this.activeCampaignId, status: "FAILED" },
        select: { contactName: true, contactPhone: true },
        orderBy: { createdAt: "desc" },
        take: QueueService.MAX_FAILED_CONTACTS,
      }),
    ]);

    const isSending = (activePendingCount > 0 || processingCount > 0) && !campaign.completedAt && !this.abortSignal;
    const isPaused = !isSending && pausedCount > 0 && !campaign.completedAt;
    const isScheduled = pendingCount > 0 && activePendingCount === 0 && processingCount === 0 && !isPaused;
    const total = campaign.totalContacts;
    const currentContactIndex = Math.max(0, total - pendingCount - processingCount - pausedCount);
    const progress = total > 0 ? Math.round((currentContactIndex / total) * 100) : 100;
    const missingCount = this.totalLogs - logOffset;
    const newLogs = missingCount > 0
      ? this.logs.slice(Math.max(0, this.logs.length - missingCount))
      : [];

    if (campaign.completedAt && pausedCount === 0 && processingCount === 0 && pendingCount === 0) {
      this.activeCampaignId = null;
    }

    return {
      isSending,
      isPaused,
      progress: campaign.completedAt ? 100 : progress,
      currentContactIndex,
      totalContacts: total,
      statusMessage: isSending
        ? `Processando fila... (${currentContactIndex}/${total})`
        : isPaused
          ? "Envio pausado. Escolha retomar ou cancelar."
          : isScheduled
            ? "Agendado"
            : campaign.completedAt
              ? "Concluido"
              : "Processamento finalizado",
      failedContacts: failedRecords.map((record) => ({ name: record.contactName, number: record.contactPhone })),
      failedContactsTotal: failedCountTotal,
      failedContactsTruncated: failedCountTotal > QueueService.MAX_FAILED_CONTACTS,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      logs: newLogs,
      totalLogs: this.totalLogs,
    };
  }

  public async startCampaign(
    campaignId: string,
    campaignName: string,
    recipients: Contact[],
    message: string,
    media: { mimetype: string; data: string; filename?: string } | null,
    templateId?: string
  ) {
    await this.withLock(async () => {
      this.isInitializing = true;
      try {
        this.activeCampaignId = campaignId;
        this.abortSignal = false;
        this.logs = [];
        this.totalLogs = 0;

        this.addLog("Processando lista de contatos...", "info");

        const safeMessage = typeof message === "string" ? message : JSON.stringify(message);
        const resolvedTemplateId = templateId ?? (await prisma.template.create({
          data: {
            title: campaignName,
            content: safeMessage,
            media: media ? JSON.stringify(media) : null,
            category: SYSTEM_TEMPLATE_CATEGORY,
          },
        })).id;

        await prisma.scheduledMessage.createMany({
          data: recipients.map((recipient) => ({
            scheduledFor: new Date(),
            status: "PENDING",
            contactName: recipient.name,
            contactPhone: recipient.number,
            templateId: resolvedTemplateId,
            batchId: campaignId,
            batchName: campaignName,
          })),
        });

        SchedulerService.wakeUp();
      } finally {
        this.isInitializing = false;
      }
    });
  }

  public async stopCampaign() {
    await this.withLock(async () => {
      this.abortSignal = true;
      if (!this.activeCampaignId) {
        return;
      }

      const targetCampaignId = this.activeCampaignId;
      const [pausedResult, processingCount] = await prisma.$transaction([
        prisma.scheduledMessage.updateMany({
          where: { batchId: targetCampaignId, status: "PENDING" },
          data: { status: "PAUSED" },
        }),
        prisma.scheduledMessage.count({
          where: { batchId: targetCampaignId, status: "PROCESSING" },
        }),
      ]);

      this.addLog(`Envio interrompido pelo usuario. ${pausedResult.count} contato(s) pausado(s).`, "warning");
      if (processingCount > 0) {
        this.addLog(`Aguardando ${processingCount} envio(s) ja em processamento finalizar(em).`, "info");
      } else {
        this.activeCampaignId = null;
      }
    });
  }

  public pushLog(message: string, type: "info" | "success" | "warning" | "error") {
    this.addLog(message, type);
  }
}

export function getQueueService(): QueueService {
  const globalState = global as unknown as { queueServiceInstance?: QueueService };
  if (!globalState.queueServiceInstance) {
    globalState.queueServiceInstance = new QueueService();
  }
  return globalState.queueServiceInstance;
}
