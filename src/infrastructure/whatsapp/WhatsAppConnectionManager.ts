import { ConnectionStatus, RiskLevel, SAFETY_LIMITS, getRiskLevel } from '@/lib/constants';

export class WhatsAppConnectionManager {
  private qrCode: string | null = null;
  private authenticated = false;
  private ready = false;
  private error: string | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private connectedSince: Date | null = null;
  private dailyCount = 0;
  private lastDailyReset = new Date();

  markInitializing() {
    this.status = ConnectionStatus.INITIALIZING;
    this.error = null;
  }

  markQrReady(qrCode: string) {
    this.qrCode = qrCode;
    this.status = ConnectionStatus.QR_READY;
    this.error = null;
  }

  markReady() {
    this.ready = true;
    this.status = ConnectionStatus.READY;
    this.qrCode = null;
    this.error = null;
    this.connectedSince = new Date();
  }

  markAuthenticated() {
    this.authenticated = true;
    this.status = ConnectionStatus.AUTHENTICATED;
    this.qrCode = null;
    this.error = null;
  }

  markAuthenticationFailure(message: string) {
    this.authenticated = false;
    this.ready = false;
    this.status = ConnectionStatus.DISCONNECTED;
    this.qrCode = null;
    this.connectedSince = null;
    this.error = message;
  }

  markDisconnected(error: string | null = null) {
    this.authenticated = false;
    this.ready = false;
    this.status = ConnectionStatus.DISCONNECTED;
    this.qrCode = null;
    this.error = error;
    this.connectedSince = null;
  }

  isReady() {
    return this.ready;
  }

  isAuthenticated() {
    return this.authenticated;
  }

  getConnectionStatus() {
    return this.status;
  }

  getQrCode() {
    return this.qrCode;
  }

  getUptime() {
    if (!this.connectedSince || !this.ready) {
      return { uptimeSeconds: null, connectedSince: null };
    }
    return {
      uptimeSeconds: Math.floor((Date.now() - this.connectedSince.getTime()) / 1000),
      connectedSince: this.connectedSince,
    };
  }

  incrementDailyCount() {
    this.resetDailyCountIfNeeded();
    this.dailyCount += 1;
  }

  getDailyCount() {
    this.resetDailyCountIfNeeded();
    return this.dailyCount;
  }

  getRiskLevel(): RiskLevel {
    return getRiskLevel(this.getDailyCount());
  }

  getSnapshot() {
    return {
      status: this.status,
      isAuthenticated: this.authenticated,
      isReady: this.ready,
      error: this.error,
      stats: {
        dailyCount: this.getDailyCount(),
        riskLevel: this.getRiskLevel(),
        recommendedLimit: SAFETY_LIMITS.RECOMMENDED_DAILY_LIMIT,
      },
    };
  }

  private resetDailyCountIfNeeded() {
    const now = new Date();
    if (now.toDateString() !== this.lastDailyReset.toDateString()) {
      this.dailyCount = 0;
      this.lastDailyReset = now;
    }
  }
}
