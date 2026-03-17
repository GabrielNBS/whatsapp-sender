import { prisma } from './db';
import { calculateSafetyDelay } from './utils';
import whatsappService from './whatsapp';
import { getCampaignService } from './CampaignService';
import { getQueueService } from './QueueService';

export function startScheduler() {
    const globalObj = global as unknown as { isSchedulerRunning?: boolean, wakeUpScheduler?: () => void };
    if (globalObj.isSchedulerRunning) {
        return;
    }
    globalObj.isSchedulerRunning = true;

    console.log('[Scheduler] Background Worker started.');

    let workerTimeout: NodeJS.Timeout | null = null;
    let isProcessing = false;

    async function workerLoop() {
        if (isProcessing) return;
        isProcessing = true;
        try {
            const now = new Date();
            
            // Pega APENAS 1 mensagem pendente mais prioritária (horário vencido ou imediato)
            const msg = await prisma.scheduledMessage.findFirst({
                where: {
                    status: 'PENDING',
                    scheduledFor: { lte: now }
                },
                orderBy: { scheduledFor: 'asc' },
                include: { template: true }
            });

            if (!msg) {
                // Sem mensagens, repousa curto antes de buscar novamente
                workerTimeout = setTimeout(workerLoop, 2000);
                return;
            }

            const queueLogs = getQueueService();
            const status = whatsappService.getStatus();
            if (!status.isReady) {
                console.log(`[Scheduler] WhatsApp not ready (Status: ${status.status} - Auth: ${status.isAuthenticated}). Sleeping 10s...`);
                queueLogs.pushLog('WhatsApp desconectado. Aguardando reconexão...', 'warning');
                workerTimeout = setTimeout(workerLoop, 10000);
                return;
            }

            let success = false;
            try {
                const mediaData = msg.template.media ? JSON.parse(msg.template.media as string) : undefined;
                await whatsappService.sendMessage(msg.contactPhone, msg.template.content, mediaData, { fallbackName: msg.contactName });
                success = true;
                queueLogs.pushLog(`Enviado para ${msg.contactName}`, 'success');
            } catch (err: unknown) {
                console.error(`[Scheduler] Error sending to ${msg.contactPhone}:`, err);
                const errorMessage = err instanceof Error ? err.message : String(err);
                queueLogs.pushLog(`Erro ao enviar para ${msg.contactName}: ${errorMessage}`, 'error');
            }

            // Atualiza o DB
            await prisma.scheduledMessage.update({
                where: { id: msg.id },
                data: { status: success ? 'SENT' : 'FAILED' }
            });

            // Atualiza campanha
            if (msg.batchId) {
                const campaignService = getCampaignService();
                if (success) {
                   await prisma.campaign.update({ where: { id: msg.batchId }, data: { sentCount: { increment: 1 } } });
                } else {
                   await prisma.campaign.update({ where: { id: msg.batchId }, data: { failedCount: { increment: 1 } } });
                }
                
                // Checa se a campanha terminou
                const pendingLeft = await prisma.scheduledMessage.count({
                   where: { batchId: msg.batchId, status: 'PENDING' }
                });

                if (pendingLeft === 0) {
                   const tmpCamp = await prisma.campaign.findUnique({ where: { id: msg.batchId }});
                   if (!tmpCamp) return;

                   const camp = await campaignService.completeCampaign(msg.batchId, {
                       sentCount: tmpCamp.sentCount,
                       failedCount: tmpCamp.failedCount
                   });
                   // The frontend use-send-polling will emit "Transmissão finalizada!" automatically when it detects the queue has ended.
                   
                   // Dispara report associado (DIP resolvido no ReportService)
                   const { getReportService } = await import('./ReportService');
                   const reportService = getReportService();
                   const config = await reportService.getConfig();
                   if (config?.sendImmediate && camp) {
                       reportService.setSender(whatsappService);
                       const reportMessage = reportService.formatImmediateReport(camp);
                       const chartUrl = reportService.getImmediateChartUrl(camp);
                       const result = await reportService.sendReportToAllRecipients(reportMessage, chartUrl);
                       if (result.success || result.sentTo.length > 0) {
                           await campaignService.markImmediateReportSent(camp.id);
                       }
                   }
                }
            }
            
            // Realiza safety delay independente da cron original. E prossegue a fila
            const delay = calculateSafetyDelay();
            workerTimeout = setTimeout(workerLoop, delay);

        } catch (error) {
            console.error('[Scheduler] Worker loop error:', error);
            workerTimeout = setTimeout(workerLoop, 5000);
        } finally {
            isProcessing = false;
        }
    }

    globalObj.wakeUpScheduler = () => {
        if (workerTimeout) clearTimeout(workerTimeout);
        if (!isProcessing) workerLoop();
    };

    // Dispara a rotina inicial
    workerLoop();
}
