import { Contact } from './types';
import { getWhatsAppInstance } from './whatsapp';
import { getCampaignService } from './CampaignService';
import { calculateSafetyDelay } from './utils';

interface QueueJob {
  campaignId: string;
  recipients: Contact[];
  message: string;
  media: { mimetype: string; data: string; filename?: string } | null;
  currentIndex: number;
  sentCount: number;
  failedCount: number;
  failedContacts: { name: string; number: string }[];
  isSending: boolean;
  isPaused: boolean;
  statusMessage: string;
  progress: number;
  logs: { message: string; type: 'info' | 'success' | 'warning' | 'error'; timestamp: number }[];
}

class QueueService {
  private currentJob: QueueJob | null = null;
  private timeoutRef: NodeJS.Timeout | null = null;
  private abortSignal: boolean = false;

  public getStatus(logOffset: number = 0) {
    if (!this.currentJob) {
      return { isSending: false, isPaused: false, logs: [] };
    }
    return {
      isSending: this.currentJob.isSending,
      isPaused: this.currentJob.isPaused,
      progress: this.currentJob.progress,
      currentContactIndex: this.currentJob.currentIndex,
      totalContacts: this.currentJob.recipients.length,
      statusMessage: this.currentJob.statusMessage,
      failedContacts: this.currentJob.failedContacts,
      sentCount: this.currentJob.sentCount,
      failedCount: this.currentJob.failedCount,
      logs: this.currentJob.logs.slice(logOffset),
    };
  }

  private addLog(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    if (this.currentJob) {
      this.currentJob.logs.push({ message, type, timestamp: Date.now() });
    }
  }

  public async startCampaign(
    campaignId: string, 
    recipients: Contact[], 
    message: string, 
    media: { mimetype: string; data: string; filename?: string } | null
  ) {
    if (this.currentJob && this.currentJob.isSending) {
      throw new Error('Já existe uma campanha em andamento.');
    }

    this.abortSignal = false;
    this.currentJob = {
      campaignId,
      recipients,
      message,
      media,
      currentIndex: 0,
      sentCount: 0,
      failedCount: 0,
      failedContacts: [],
      isSending: true,
      isPaused: false,
      statusMessage: 'Iniciando transmissão no servidor...',
      progress: 0,
      logs: [],
    };

    console.log(`[QueueService] Started queue for campaign ${campaignId}`);
    // Opcionalmente também pode adicionar um log inicial, se desejado.
    // this.addLog('Iniciando transmissão no servidor...', 'info');
    
    // Inicia o processamento assíncrono (não bloqueante)
    this.processQueue();
  }

  public stopCampaign() {
    this.abortSignal = true;
    if (this.currentJob) {
      this.currentJob.isSending = false;
      this.currentJob.isPaused = false;
      this.currentJob.statusMessage = 'Envio interrompido pelo usuário.';
    }
    if (this.timeoutRef) {
      clearTimeout(this.timeoutRef);
      this.timeoutRef = null;
    }
    // Complete whatever was sent
    this.finalizeCampaign();
  }

  private async processQueue() {
    if (!this.currentJob || this.abortSignal) return;

    if (this.currentJob.currentIndex >= this.currentJob.recipients.length) {
      console.log(`[QueueService] Campaign ${this.currentJob.campaignId} completed!`);
      await this.finalizeCampaign();
      return;
    }

    const index = this.currentJob.currentIndex;
    const contact = this.currentJob.recipients[index];
    const total = this.currentJob.recipients.length;

    this.currentJob.progress = Math.round((index / total) * 100);
    this.currentJob.statusMessage = `Enviando para ${contact.name} (${contact.number})...`;

    try {
      if (this.abortSignal) return;
      if (this.currentJob?.isPaused) {
        this.timeoutRef = setTimeout(() => this.processQueue(), 5000);
        return;
      }

      const whatsapp = getWhatsAppInstance();
      if (!whatsapp || !whatsapp.getStatus().isAuthenticated) {
        throw new Error('WhatsApp não está conectado.');
      }

      await whatsapp.sendMessage(contact.number, this.currentJob.message, this.currentJob.media || undefined, { fallbackName: contact.name });
      
      if (this.abortSignal) return;

      // Reset pause if successful
      this.currentJob.isPaused = false;

      this.currentJob.sentCount++;
      console.log(`[QueueService] ✅ Enviado para ${contact.name}`);
      this.addLog(`Enviado para ${contact.name}`, 'success');

      this.currentJob.currentIndex++;

      if (this.currentJob.currentIndex < total) {
        const nextContact = this.currentJob.recipients[this.currentJob.currentIndex];
        const delay = calculateSafetyDelay();
        const nextName = nextContact.name.split(' ')[0];
        const remainingSecs = Math.ceil(delay / 1000);

        this.currentJob.statusMessage = `Aguardando ${remainingSecs}s para enviar para ${nextName}...`;

        this.timeoutRef = setTimeout(() => {
          if (!this.abortSignal) this.processQueue();
        }, delay);
      } else {
        // Queue finished
        this.processQueue();
      }
    } catch (error: unknown) {
      if (this.abortSignal) return;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[QueueService] ❌ Erro ao enviar para ${contact.name}:`, error);

      // Circuit Breaker: se for erro de desconexão, pausa e tenta novamente o mesmo contato depois
      if (errorMessage.includes('WhatsApp não está conectado') || errorMessage.includes('Não autenticado')) {
        this.currentJob.isPaused = true;
        this.currentJob.statusMessage = `WhatsApp desconectado. Aguardando reconexão...`;
        this.addLog('Fila pausada automaticamente aguardando o WhatsApp reconectar.', 'warning');
        
        // Aguarda 10 segundos e tenta o mesmo currentIndex
        this.timeoutRef = setTimeout(() => {
          if (!this.abortSignal) {
            // Check if connection is back to resume
            const wa = getWhatsAppInstance();
            if (wa && wa.getStatus().isAuthenticated) {
              if (this.currentJob) this.currentJob.isPaused = false;
              this.addLog('WhatsApp reconectado. Retomando fila...', 'info');
            }
            this.processQueue();
          }
        }, 10000);
        return;
      }

      this.currentJob.failedCount++;
      this.currentJob.failedContacts.push({ name: contact.name, number: contact.number });
      this.addLog(`Erro ao enviar para ${contact.name}: ${errorMessage}`, 'error');
      
      this.currentJob.currentIndex++;

      this.timeoutRef = setTimeout(() => {
        if (!this.abortSignal) this.processQueue();
      }, 5000); // Wait 5s on error
    }
  }

  private async finalizeCampaign() {
    if (!this.currentJob) return;
    
    this.currentJob.isSending = false;
    this.currentJob.progress = 100;

    try {
      // Usar a mesma rota de complete (fazer POST interno pra API) ou usar os services direto
      // Melhor usar Services direto pra evitar fetch circular.
      const campaignService = getCampaignService();
      await campaignService.completeCampaign(this.currentJob.campaignId, {
        sentCount: this.currentJob.sentCount,
        failedCount: this.currentJob.failedCount
      });

      // ReportService is automatically called in api/campaigns/[id]/complete, but since we are calling campaignService directly, we must trigger report here too.
      // Actually, since we are decoupling, the frontend handles nothing. We should trigger report from here.
      const { getReportService } = await import('./ReportService');
      const reportService = getReportService();
      const config = await reportService.getConfig();
      
      if (config?.sendImmediate) {
        const campaign = await campaignService.getCampaign(this.currentJob.campaignId);
        if (campaign) {
          const reportMessage = reportService.formatImmediateReport(campaign);
          const chartUrl = reportService.getImmediateChartUrl(campaign);
          const result = await reportService.sendReportToAllRecipients(reportMessage, chartUrl);
          if (result.success || result.sentTo.length > 0) {
            await campaignService.markImmediateReportSent(this.currentJob.campaignId);
          }
        }
      }

    } catch (err) {
      console.error('[QueueService] Erro ao finalizar campanha:', err);
    } finally {
      // Apagamos o job atual para liberar o envio
      setTimeout(() => {
         this.currentJob = null;
      }, 5000); // Keep status complete for 5s for UI to catch it
    }
  }
}

// Singleton export
let queueServiceInstance: QueueService | null = null;
export function getQueueService(): QueueService {
  if (!queueServiceInstance) {
    queueServiceInstance = new QueueService();
  }
  return queueServiceInstance;
}
