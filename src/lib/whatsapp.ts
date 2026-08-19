import type { WhatsAppService } from '@/infrastructure/whatsapp/WhatsAppWebJsGateway';
import {
  getWhatsAppInstance,
  peekWhatsAppInstance,
} from '@/server/composition/whatsapp';

const service = new Proxy({} as WhatsAppService, {
  get(_target, property, receiver) {
    const instance = getWhatsAppInstance();
    const value = Reflect.get(instance, property, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export { getWhatsAppInstance, peekWhatsAppInstance };
export type { WhatsAppService } from '@/infrastructure/whatsapp/WhatsAppWebJsGateway';
export default service;
