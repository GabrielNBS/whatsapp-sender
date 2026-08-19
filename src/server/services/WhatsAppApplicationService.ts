import type { WhatsAppGateway } from '@/server/ports/WhatsAppGateway';

export class WhatsAppApplicationService {
  constructor(private readonly gateway: WhatsAppGateway) {}

  getConnectionSnapshot() {
    return { qr: this.gateway.getQrCode(), status: this.gateway.getStatus() };
  }

  getStatus() {
    return this.gateway.getStatus();
  }

  getAvatar(phone: string) {
    return this.gateway.getProfilePicUrl(phone);
  }

  logout() {
    return this.gateway.logout();
  }
}

