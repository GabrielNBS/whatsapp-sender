import { prisma } from "./db";

export interface RealtimeMetrics {
  connection: {
    status: "connected" | "disconnected" | "initializing";
    uptimeSeconds: number | null;
    connectedSince: Date | null;
  };
  processing: {
    pendingMessages: number;
    pollingCycles: number;
    currentIntervalMs: number;
    lastPollingTime: Date | null;
  };
  reads: {
    byEvent: number;
    byPolling: number;
    total: number;
  };
  today: {
    messagesSent: number;
    messagesRead: number;
    engagementRate: number;
  };
}

export interface EngagementStats {
  totalContacts: number;
  totalMessagesSent: number;
  totalMessagesRead: number;
  averageEngagementRate: number;
  topEngaged: Array<{ phone: string; readCount: number }>;
  inactive: number;
}

export interface IMetricsService {
  getRealtimeMetrics(): Promise<RealtimeMetrics>;
  getEngagementStats(): Promise<EngagementStats>;
  getTodayStats(): Promise<{ sent: number; read: number }>;
  getDashboardChartsData(): Promise<{
    funnel: Array<{ name: string; value: number }>;
    trends: Array<{ date: string; sent: number; read: number; responses: number }>;
  }>;
}

export class MetricsService implements IMetricsService {
  async getRealtimeMetrics(): Promise<RealtimeMetrics> {
    const whatsappMetrics = await this.getWhatsAppMetrics();
    const todayStats = await this.getTodayStats();

    return {
      connection: {
        status: whatsappMetrics.isReady
          ? "connected"
          : whatsappMetrics.isAuthenticated
            ? "initializing"
            : "disconnected",
        uptimeSeconds: whatsappMetrics.uptimeSeconds,
        connectedSince: whatsappMetrics.connectedSince,
      },
      processing: {
        pendingMessages: whatsappMetrics.polling.currentPendingCount,
        pollingCycles: whatsappMetrics.polling.pollingCycles,
        currentIntervalMs: whatsappMetrics.polling.currentIntervalMs,
        lastPollingTime: whatsappMetrics.polling.lastPollingTime,
      },
      reads: {
        byEvent: whatsappMetrics.polling.readsFoundByEvent,
        byPolling: whatsappMetrics.polling.readsFoundByPolling,
        total: whatsappMetrics.polling.readsFoundByEvent + whatsappMetrics.polling.readsFoundByPolling,
      },
      today: {
        messagesSent: todayStats.sent,
        messagesRead: todayStats.read,
        engagementRate: todayStats.sent > 0 ? Math.round((todayStats.read / todayStats.sent) * 100) : 0,
      },
    };
  }

  async getEngagementStats(): Promise<EngagementStats> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalContacts, totals, inactive, topEngaged] = await Promise.all([
      prisma.contactAnalytics.count(),
      prisma.contactAnalytics.aggregate({
        _sum: { sentCount: true, readCount: true },
      }),
      prisma.contactAnalytics.count({
        where: {
          OR: [{ lastReadAt: null }, { lastReadAt: { lt: thirtyDaysAgo } }],
        },
      }),
      prisma.contactAnalytics.findMany({
        orderBy: { readCount: "desc" },
        take: 5,
        select: { phone: true, readCount: true },
      }),
    ]);

    const totalMessagesSent = totals._sum.sentCount ?? 0;
    const totalMessagesRead = totals._sum.readCount ?? 0;

    return {
      totalContacts,
      totalMessagesSent,
      totalMessagesRead,
      averageEngagementRate: totalMessagesSent > 0 ? Math.round((totalMessagesRead / totalMessagesSent) * 100) : 0,
      topEngaged,
      inactive,
    };
  }

  async getTodayStats(): Promise<{ sent: number; read: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [sent, read] = await Promise.all([
      prisma.scheduledMessage.count({
        where: {
          status: "SENT",
          updatedAt: { gte: today },
        },
      }),
      prisma.contactAnalytics.count({
        where: {
          lastReadAt: { gte: today },
        },
      }),
    ]);

    return { sent, read };
  }

  async getDashboardChartsData(): Promise<{
    funnel: Array<{ name: string; value: number }>;
    trends: Array<{ date: string; sent: number; read: number; responses: number }>;
  }> {
    const campaignTotals = await prisma.campaign.aggregate({
      _sum: {
        sentCount: true,
        readCount: true,
        responseCount: true,
      },
    });

    const totalSent = campaignTotals._sum.sentCount ?? 0;
    const totalReads = Math.min(campaignTotals._sum.readCount ?? 0, totalSent);
    const totalResponses = Math.min(campaignTotals._sum.responseCount ?? 0, totalReads);

    const funnel = [
      { name: "Enviadas", value: totalSent },
      { name: "Lidas", value: totalReads },
      { name: "Respostas", value: totalResponses },
    ];

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    const campaigns = await prisma.campaign.findMany({
      where: { startedAt: { gte: last7Days } },
      orderBy: { startedAt: "asc" },
    });

    const trendsMap = new Map<string, { sent: number; read: number; responses: number }>();
    for (let index = 0; index < 7; index++) {
      const day = new Date(last7Days);
      day.setDate(day.getDate() + index);
      const key = day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      trendsMap.set(key, { sent: 0, read: 0, responses: 0 });
    }

    for (const campaign of campaigns) {
      const key = campaign.startedAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const current = trendsMap.get(key);
      if (!current) {
        continue;
      }
      current.sent += campaign.sentCount;
      current.read += campaign.readCount;
      current.responses += campaign.responseCount;
    }

    const trends = Array.from(trendsMap.entries()).map(([date, data]) => ({
      date,
      sent: data.sent,
      read: data.read,
      responses: data.responses,
    }));

    return { funnel, trends };
  }

  private async getWhatsAppMetrics(): Promise<{
    isAuthenticated: boolean;
    isReady: boolean;
    uptimeSeconds: number | null;
    connectedSince: Date | null;
    polling: {
      pollingCycles: number;
      readsFoundByPolling: number;
      readsFoundByEvent: number;
      currentPendingCount: number;
      currentIntervalMs: number;
      lastPollingTime: Date | null;
    };
  }> {
    try {
      const { peekWhatsAppInstance } = await import("./whatsapp");
      const instance = peekWhatsAppInstance();
      if (!instance) {
        return this.getDefaultWhatsAppMetrics();
      }

      const status = instance.getStatus();
      const polling = instance.getPollingMetrics();
      const uptime = instance.getUptime();

      return {
        isAuthenticated: status.isAuthenticated,
        isReady: status.isReady,
        uptimeSeconds: uptime.uptimeSeconds,
        connectedSince: uptime.connectedSince,
        polling,
      };
    } catch {
      return this.getDefaultWhatsAppMetrics();
    }
  }

  private getDefaultWhatsAppMetrics() {
    return {
      isAuthenticated: false,
      isReady: false,
      uptimeSeconds: null,
      connectedSince: null,
      polling: {
        pollingCycles: 0,
        readsFoundByPolling: 0,
        readsFoundByEvent: 0,
        currentPendingCount: 0,
        currentIntervalMs: 0,
        lastPollingTime: null,
      },
    };
  }
}

let metricsServiceInstance: MetricsService | null = null;

export function getMetricsService(): MetricsService {
  if (!metricsServiceInstance) {
    metricsServiceInstance = new MetricsService();
  }
  return metricsServiceInstance;
}
