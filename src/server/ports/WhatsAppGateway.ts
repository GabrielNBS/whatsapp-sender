import type { TemplateMediaPayload } from '@/lib/types';

export interface WhatsAppGateway {
  sendMessage(
    to: string,
    message: string,
    media?: TemplateMediaPayload,
    options?: { fallbackName?: string },
  ): Promise<{ success: boolean }>;
  getStatus(): unknown;
  getQrCode(): string | null;
  getProfilePicUrl(phone: string): Promise<string | null>;
  logout(): Promise<void>;
}

