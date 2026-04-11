import { Contact } from './types';
import { prisma } from './db';

class QueueService {
  private activeCampaignId: string | null = null;
  private abortSignal = false;
  private isInitializing = false;
  private operationLock: Promise<void> = Promise.resolve();
  private logs: { message: string, type: 'info'|'success'|'warning'|'error', timestamp: number }[] = [];
  private totalLogs = 0;

  private static readonly MAX_FAILED_CONTACTS = 200;

  private addLog(message: string, type: 'info'|'success'|'warning'|'error' = 'info') {
    this.logs.push({ message, type, timestamp: Date.now() });
    this.totalLogs++;
    if (this.logs.length > 500) this.logs.shift();
  }

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const previous = this.operationLock;
    let release!: () => void;
    this.operationLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;
    try {
      return await fn();
    } finally {
      release();
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
        statusMessage: 'Iniciando transmissao no servidor...',
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
      const recent = await prisma.campaign.findFirst({
        where: { completedAt: null },
        orderBy: { startedAt: 'desc' }
      }) ?? await prisma.campaign.findFirst({
        orderBy: { startedAt: 'desc' }
      });

      if (!recent) {
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

      this.activeCampaignId = recent.id;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: this.activeCampaignId! }
    });

    if (!campaign) {
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
      prisma.scheduledMessage.count({
        where: { batchId: this.activeCampaignId!, status: 'PENDING' }
      }),
      prisma.scheduledMessage.count({
        where: {
          batchId: this.activeCampaignId!,
          status: 'PENDING',
          scheduledFor: { lte: new Date() }
        }
      }),
      prisma.scheduledMessage.count({
        where: {
          batchId: this.activeCampaignId!,
          status: 'PROCESSING'
        }
      }),
      prisma.scheduledMessage.count({
        where: {
          batchId: this.activeCampaignId!,
          status: 'PAUSED'
        }
      }),
      prisma.scheduledMessage.count({
        where: {
          batchId: this.activeCampaignId!,
          status: 'FAILED'
        }
      }),
      prisma.scheduledMessage.findMany({
        where: { batchId: this.activeCampaignId!, status: 'FAILED' },
        select: { contactName: true, contactPhone: true },
        orderBy: { createdAt: 'desc' },
        take: QueueService.MAX_FAILED_CONTACTS,
      })
    ]);

    const isSending = (activePendingCount > 0 || processingCount > 0) && !campaign.completedAt && !this.abortSignal;
    const isPaused = !isSending && pausedCount > 0 && !campaign.completedAt;
    const isScheduled = pendingCount > 0 && activePendingCount === 0 && processingCount === 0 && !isPaused;

    const sentCount = campaign.sentCount;
    const failedCount = campaign.failedCount;
    const total = campaign.totalContacts;

    const currentContactIndex = Math.max(0, total - pendingCount - processingCount - pausedCount);
    const progress = total > 0 ? Math.round((currentContactIndex / total) * 100) : 100;

    const missingCount = this.totalLogs - logOffset;
    let newLogs: { message: string, type: 'info'|'success'|'warning'|'error', timestamp: number }[] = [];
    if (missingCount > 0) {
      const startIndex = Math.max(0, this.logs.length - missingCount);
      newLogs = this.logs.slice(startIndex);
    }

    if (campaign.completedAt) {
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
        : (isPaused
          ? 'Envio pausado. Escolha retomar ou cancelar.'
          : (isScheduled ? 'Agendado' : (campaign.completedAt ? 'Concluido' : 'Processamento finalizado'))),
      failedContacts: failedRecords.map(r => ({ name: r.contactName, number: r.contactPhone })),
      failedContactsTotal: failedCountTotal,
      failedContactsTruncated: failedCountTotal > QueueService.MAX_FAILED_CONTACTS,
      sentCount,
      failedCount,
      logs: newLogs,
      totalLogs: this.totalLogs
    };
  }

  public async startCampaign(
    campaignId: string,
    campaignName: string,
    recipients: Contact[],
    message: string,
    media: { mimetype: string; data: string; filename?: string } | null
  ) {
    await this.withLock(async () => {
      this.isInitializing = true;
      try {
        this.activeCampaignId = campaignId;
        this.abortSignal = false;
        this.logs = [];
        this.totalLogs = 0;

        this.addLog('Processando lista de contatos...', 'info');

        const stringifiedMedia = media ? JSON.stringify(media) : null;
        const safeMessage = typeof message === 'string' ? message : JSON.stringify(message);
        let template = await prisma.template.findFirst({
          where: {
            content: safeMessage,
            media: stringifiedMedia
          }
        });

        if (!template) {
          template = await prisma.template.create({
            data: {
              title: campaignName,
              content: safeMessage,
              media: stringifiedMedia,
              category: 'SYSTEM'
            }
          });
        }

        await prisma.$transaction(
          recipients.map((r) => prisma.scheduledMessage.create({
            data: {
              scheduledFor: new Date(),
              status: 'PENDING',
              contactName: r.name,
              contactPhone: r.number,
              templateId: template.id,
              batchId: campaignId,
              batchName: campaignName
            }
          }))
        );

        const g = global as unknown as { wakeUpScheduler?: () => void };
        g.wakeUpScheduler?.();
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
          where: { batchId: targetCampaignId, status: 'PENDING' },
          data: { status: 'PAUSED' }
        }),
        prisma.scheduledMessage.count({
          where: { batchId: targetCampaignId, status: 'PROCESSING' }
        })
      ]);

      this.addLog(`Envio interrompido pelo usuario. ${pausedResult.count} contato(s) pausado(s).`, 'warning');
      if (processingCount > 0) {
        this.addLog(`Aguardando ${processingCount} envio(s) ja em processamento finalizar(em).`, 'info');
      }

      this.activeCampaignId = null;
    });
  }

  public pushLog(message: string, type: 'info'|'success'|'warning'|'error') {
    this.addLog(message, type);
  }
}

// Singleton export using global for Next.js dev mode reliability
export function getQueueService(): QueueService {
  const g = global as unknown as { queueServiceInstance?: QueueService };
  if (!g.queueServiceInstance) {
    g.queueServiceInstance = new QueueService();
  }
  return g.queueServiceInstance;
}

