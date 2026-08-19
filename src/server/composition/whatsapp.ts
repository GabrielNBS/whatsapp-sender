import { prisma } from '@/lib/db';
import { AnalyticsService } from '@/lib/AnalyticsService';
import { MessageFormatter } from '@/lib/MessageFormatter';
import { WhatsAppService } from '@/infrastructure/whatsapp/WhatsAppWebJsGateway';
import { getContactConsentService } from '@/server/services/ContactConsentService';
import { ConsentIncomingWhatsAppMessageHandler } from '@/server/services/IncomingWhatsAppMessageHandler';
import { getCurrentWorkspaceId } from '@/server/workspace';

declare global {
  var whatsappClientInstance: WhatsAppService | undefined;
}

function createWhatsAppService() {
  const workspaceId = getCurrentWorkspaceId();
  return new WhatsAppService(
    new AnalyticsService(prisma, workspaceId),
    new MessageFormatter(),
    new ConsentIncomingWhatsAppMessageHandler(getContactConsentService(), workspaceId),
  );
}

export function getWhatsAppInstance(): WhatsAppService {
  if (!global.whatsappClientInstance) {
    global.whatsappClientInstance = createWhatsAppService();
  }
  return global.whatsappClientInstance;
}

export function peekWhatsAppInstance(): WhatsAppService | undefined {
  return global.whatsappClientInstance;
}
