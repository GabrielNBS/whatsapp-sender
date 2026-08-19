import { logger } from '@/lib/logger';
import type { ContactConsentService } from '@/server/services/ContactConsentService';

export interface IncomingWhatsAppMessageLike {
  from: string;
  body: string;
  fromMe: boolean;
  id?: { _serialized?: string };
  getContact?: () => Promise<{ name?: string; pushname?: string }>;
}

export interface IncomingWhatsAppMessageHandler {
  handle(message: IncomingWhatsAppMessageLike): Promise<void>;
}

export class ConsentIncomingWhatsAppMessageHandler implements IncomingWhatsAppMessageHandler {
  constructor(
    private readonly consentService: ContactConsentService,
    private readonly workspaceId: string,
  ) {}

  async handle(message: IncomingWhatsAppMessageLike) {
    try {
      const contact = message.getContact ? await message.getContact().catch(() => null) : null;
      const result = await this.consentService.captureIncomingOptOut({
        from: message.from,
        body: message.body,
        fromMe: message.fromMe,
        messageId: message.id?._serialized,
        contactName: contact?.pushname || contact?.name || null,
      }, this.workspaceId);

      if (result.changed) {
        logger.info({ source: 'WHATSAPP' }, '[Consent] Opt-out recebido e aplicado');
      }
    } catch (error) {
      logger.error({ err: error }, '[Consent] Falha ao processar opt-out recebido');
    }
  }
}
