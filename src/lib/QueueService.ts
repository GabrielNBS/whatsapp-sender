import { Contact } from './types';
import { prisma } from './db';

class QueueService {
  private activeCampaignId: string | null = null;
  private abortSignal = false;
  private logs: { message: string, type: 'info'|'success'|'warning'|'error', timestamp: number }[] = [];
  private totalLogs = 0;

  private addLog(message: string, type: 'info'|'success'|'warning'|'error' = 'info') {
    this.logs.push({ message, type, timestamp: Date.now() });
    this.totalLogs++;
    if (this.logs.length > 500) this.logs.shift(); // Keep last 500
  }

  public async getStatus(logOffset: number = 0) {
    if (!this.activeCampaignId) {
      // Find the most recently active campaign to resume status
      const recent = await prisma.campaign.findFirst({
        orderBy: { startedAt: 'desc' }
      });
      if (!recent) return { isSending: false, isPaused: false, progress: 100, logs: [], failedContacts: [] };
      this.activeCampaignId = recent.id;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: this.activeCampaignId! }
    });

    if (!campaign) {
      return { isSending: false, isPaused: false, progress: 100, logs: [], failedContacts: [] };
    }

    const pendingCount = await prisma.scheduledMessage.count({
      where: { batchId: this.activeCampaignId!, status: 'PENDING' }
    });

    const isSending = pendingCount > 0 && !campaign.completedAt && !this.abortSignal;
    const sentCount = campaign.sentCount;
    const failedCount = campaign.failedCount;
    const total = campaign.totalContacts;
    
    const currentContactIndex = total - pendingCount;
    const progress = total > 0 ? Math.round((currentContactIndex / total) * 100) : 100;

    const failedRecords = await prisma.scheduledMessage.findMany({
      where: { batchId: this.activeCampaignId!, status: 'FAILED' },
      select: { contactName: true, contactPhone: true }
    });

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
      isSending: isSending,
      isPaused: !isSending && pendingCount > 0 && !this.abortSignal,
      progress: campaign.completedAt ? 100 : progress,
      currentContactIndex,
      totalContacts: total,
      statusMessage: isSending ? `Processando fila... (${currentContactIndex}/${total})` : (campaign.completedAt ? 'Concluído' : 'Processamento Pausado / Parado'),
      failedContacts: failedRecords.map(r => ({ name: r.contactName, number: r.contactPhone })),
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
    this.activeCampaignId = campaignId;
    this.abortSignal = false;
    this.logs = [];

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
            media: stringifiedMedia
          }
        });
    }

    // Insere os contatos na fila do banco (ScheduledMessage)
    await prisma.$transaction(
        recipients.map(r => prisma.scheduledMessage.create({
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

    // Wake up scheduler immediately
    const g = global as unknown as { wakeUpScheduler?: () => void };
    if (g.wakeUpScheduler) {
       g.wakeUpScheduler();
    }
  }

  public async stopCampaign() {
    this.abortSignal = true;
    if (this.activeCampaignId) {
      await prisma.scheduledMessage.updateMany({
        where: { batchId: this.activeCampaignId, status: 'PENDING' },
        data: { status: 'FAILED' }
      });
      this.addLog('Envio interrompido pelo usuário.', 'warning');
      this.activeCampaignId = null; // Clear from memory so it stops appearing as active
    }
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
