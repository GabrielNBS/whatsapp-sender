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

  constructor(private workspaceId: string) {}

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

  private getIdleStatus() {
    return {
      isSending: false,
      isPaused: false,
      isScheduled: false,
      progress: 100,
      currentContactIndex: 0,
      totalContacts: 0,
      statusMessage: null,
      logs: [],
      failedContacts: [],
      sentCount: 0,
      failedCount: 0,
      totalLogs: this.totalLogs,
      failedContactsTotal: 0,
      failedContactsTruncated: false,
    };
  }

  public async getStatus(logOffset: number = 0, includeFailures = false) {
    if (this.isInitializing) {
      return {
        isSending: true,
        isPaused: false,
        isScheduled: false,
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
      const openCampaigns = await prisma.campaign.findMany({
        where: { workspaceId: this.workspaceId, completedAt: null },
        select: { id: true },
      });
      const openCampaignIds = openCampaigns.map((campaign) => campaign.id);
      const activeBatchWhere = {
        workspaceId: this.workspaceId,
        batchId: { in: openCampaignIds },
      } as const;
      const now = new Date();
      const activeBatch = await prisma.scheduledMessage.findFirst({
        where: {
          ...activeBatchWhere,
          status: { in: ["PENDING", "PROCESSING"] },
          scheduledFor: { lte: now },
        },
        orderBy: { scheduledFor: "asc" },
        select: { batchId: true },
      }) ?? await prisma.scheduledMessage.findFirst({
        where: { ...activeBatchWhere, status: "PAUSED" },
        orderBy: { scheduledFor: "asc" },
        select: { batchId: true },
      }) ?? await prisma.scheduledMessage.findFirst({
        where: { ...activeBatchWhere, status: "PENDING" },
        orderBy: { scheduledFor: "asc" },
        select: { batchId: true },
      });

      if (!activeBatch?.batchId) {
        return this.getIdleStatus();
      }

      this.activeCampaignId = activeBatch.batchId;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: this.activeCampaignId, workspaceId: this.workspaceId },
    });

    if (!campaign) {
      this.activeCampaignId = null;
      return this.getIdleStatus();
    }

    const campaignId = this.activeCampaignId;

    const [statusGroups, activePendingCount] = await Promise.all([
      prisma.scheduledMessage.groupBy({
        by: ['status'],
        where: { workspaceId: this.workspaceId, batchId: campaignId },
        _count: { _all: true },
      }),
      prisma.scheduledMessage.count({
        where: { workspaceId: this.workspaceId, batchId: campaignId, status: "PENDING", scheduledFor: { lte: new Date() } },
      }),
    ]);

    const countsByStatus = new Map(statusGroups.map((group) => [group.status, group._count._all]));
    const pendingCount = countsByStatus.get('PENDING') ?? 0;
    const processingCount = countsByStatus.get('PROCESSING') ?? 0;
    const pausedCount = countsByStatus.get('PAUSED') ?? 0;
    const failedCountTotal = countsByStatus.get('FAILED') ?? 0;

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

    const failedRecords = includeFailures && failedCountTotal > 0
      ? await prisma.scheduledMessage.findMany({
        where: { workspaceId: this.workspaceId, batchId: campaignId, status: 'FAILED' },
        select: { contactName: true, contactPhone: true },
        orderBy: { createdAt: 'desc' },
        take: QueueService.MAX_FAILED_CONTACTS,
      })
      : [];

    return {
      isSending,
      isPaused,
      isScheduled,
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
      failedContactsTruncated: includeFailures && failedCountTotal > QueueService.MAX_FAILED_CONTACTS,
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
            workspaceId: this.workspaceId,
            content: safeMessage,
            media: media ? JSON.stringify(media) : null,
            category: SYSTEM_TEMPLATE_CATEGORY,
          },
        })).id;

        const queueStartAt = Date.now() - recipients.length;

        await prisma.scheduledMessage.createMany({
          data: recipients.map((recipient, index) => ({
            // A unique timestamp keeps the database queue in the same order
            // as the groups and contacts selected by the user.
            scheduledFor: new Date(queueStartAt + index),
            workspaceId: this.workspaceId,
            status: "PENDING",
            contactName: recipient.name,
            contactPhone: recipient.number,
            contactId: recipient.id.startsWith('temp-recip-') ? null : recipient.id,
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
          where: { workspaceId: this.workspaceId, batchId: targetCampaignId, status: "PENDING" },
          data: { status: "PAUSED" },
        }),
        prisma.scheduledMessage.count({
          where: { workspaceId: this.workspaceId, batchId: targetCampaignId, status: "PROCESSING" },
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

export function getQueueService(workspaceId: string): QueueService {
  const globalState = global as unknown as { queueServiceInstances?: Map<string, QueueService> };
  globalState.queueServiceInstances ??= new Map();
  let instance = globalState.queueServiceInstances.get(workspaceId);
  if (!instance) {
    instance = new QueueService(workspaceId);
    globalState.queueServiceInstances.set(workspaceId, instance);
  }
  return instance;
}
