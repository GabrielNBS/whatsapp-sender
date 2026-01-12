import cron from 'node-cron';
import { prisma } from './db';
import { calculateSafetyDelay } from './utils'; // Shared logic
import whatsappService from './whatsapp';

export function startScheduler() {
    if ((global as any).isSchedulerRunning) {
        return;
    }
    (global as any).isSchedulerRunning = true;

    console.log('[Scheduler] Service started.');

    let isProcessing = false;

    cron.schedule('* * * * *', async () => {
        if (isProcessing) {
            console.log('[Scheduler] Previous job still running, skipping...');
            return;
        }
        isProcessing = true;
        
        try {
            const now = new Date();
            const pendingMessages = await prisma.scheduledMessage.findMany({
                where: {
                    status: 'PENDING',
                    scheduledFor: {
                        lte: now,
                        gte: new Date(now.getTime() - 60 * 60 * 1000) // Don't process if > 1h late (stale)
                    }
                },
                include: {
                    template: true
                }
            });

            if (pendingMessages.length === 0) return;

            console.log(`[Scheduler] Check at ${now.toISOString()}: Found ${pendingMessages.length} messages.`);

            const status = whatsappService.getStatus();
            if (!status.isReady) {
                console.log(`[Scheduler] WhatsApp client not ready (Status: ${status.status} - Auth: ${status.isAuthenticated}). Skipping sending for now.`);
                return;
            }

            for (const msg of pendingMessages) {
                const content = msg.template.content;
                // Note: We don't replace here anymore, we let whatsappService handle it with pushname
                
                let mediaData = undefined;
                if ((msg.template as any).media) {
                    try {
                        mediaData = JSON.parse((msg.template as any).media);
                    } catch (e) {
                        console.error('Failed to parse media for template', msg.templateId);
                    }
                }

                try {
                    console.log(`[Scheduler] Sending to ${msg.contactName} (${msg.contactPhone})`);
                    await whatsappService.sendMessage(msg.contactPhone, content, mediaData, { fallbackName: msg.contactName });

                    await prisma.scheduledMessage.update({
                        where: { id: msg.id },
                        data: { status: 'SENT' }
                    });
                } catch (err: any) {
                    console.error(`[Scheduler] Failed to send to ${msg.contactName}`, err);
                    await prisma.scheduledMessage.update({
                        where: { id: msg.id },
                        data: { status: 'FAILED' }
                    });
                }
                
                // Safety Delay: 15s to 30s
                const delay = calculateSafetyDelay();
                console.log(`[Scheduler] Waiting ${delay/1000}s before next message...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }

        } catch (error) {
            console.error('[Scheduler] Error processing schedule:', error);
        } finally {
            isProcessing = false;
        }
    });
}
