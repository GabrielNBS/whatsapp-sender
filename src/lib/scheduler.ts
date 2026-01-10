import cron from 'node-cron';
import { prisma } from './db';
import whatsappService from './whatsapp';

export function startScheduler() {
    if ((global as any).isSchedulerRunning) {
        return;
    }
    (global as any).isSchedulerRunning = true;

    console.log('[Scheduler] Service started.');

    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const pendingMessages = await prisma.scheduledMessage.findMany({
                where: {
                    status: 'PENDING',
                    scheduledFor: {
                        lte: now
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
                console.log('[Scheduler] WhatsApp client not ready. Skipping sending for now.');
                return;
            }

            for (const msg of pendingMessages) {
                let content = msg.template.content;
                // Use stored name/phone
                if (msg.contactName) content = content.replace(/{{name}}/g, msg.contactName).replace(/{{nome}}/g, msg.contactName);
                if (msg.contactPhone) content = content.replace(/{{phone}}/g, msg.contactPhone);

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
                    await whatsappService.sendMessage(msg.contactPhone, content, mediaData);

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
            }

        } catch (error) {
            console.error('[Scheduler] Error processing schedule:', error);
        }
    });
}
