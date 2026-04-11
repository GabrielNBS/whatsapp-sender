/**
 * MetricsService - Agregação de métricas do sistema
 * 
 * PRINCÍPIO: Single Responsibility (SRP)
 * - Responsável APENAS por agregar e formatar métricas
 * - Não faz operações de banco ou envio de mensagens
 * 
 * PRINCÍPIO: Dependency Inversion (DIP)
 * - Interface permite injeção de dependências em testes
 */

import { prisma } from "./db";

// ============================================
// INTERFACES (para Dependency Inversion)
// ============================================

export interface RealtimeMetrics {
  /** Status da conexão WhatsApp */
  connection: {
    status: "connected" | "disconnected" | "initializing";
    uptimeSeconds: number | null;
    connectedSince: Date | null;
  };
  
  /** Métricas de processamento */
  processing: {
    pendingMessages: number;
    pollingCycles: number;
    currentIntervalMs: number;
    lastPollingTime: Date | null;
  };
  
  /** Métricas de leitura */
  reads: {
    byEvent: number;
    byPolling: number;
    total: number;
  };
  
  /** Métricas de hoje */
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

// ============================================
// IMPLEMENTAÇÃO
// ============================================

export class MetricsService implements IMetricsService {
  
  /**
   * Obtém métricas em tempo real do sistema
   * Combina dados do WhatsAppService e do banco
   */
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
        engagementRate: todayStats.sent > 0 
          ? Math.round((todayStats.read / todayStats.sent) * 100) 
          : 0,
      },
    };
  }

  /**
   * Obtém estatísticas gerais de engajamento
   */
  async getEngagementStats(): Promise<EngagementStats> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalContacts, totals, inactive, topEngaged] = await Promise.all([
      prisma.contactAnalytics.count(),
      prisma.contactAnalytics.aggregate({
        _sum: {
          sentCount: true,
          readCount: true,
        },
      }),
      prisma.contactAnalytics.count({
        where: {
          OR: [
            { lastReadAt: null },
            { lastReadAt: { lt: thirtyDaysAgo } },
          ],
        },
      }),
      prisma.contactAnalytics.findMany({
        orderBy: { readCount: "desc" },
        take: 5,
        select: {
          phone: true,
          readCount: true,
        },
      }),
    ]);

    const totalMessagesSent = totals._sum.sentCount ?? 0;
    const totalMessagesRead = totals._sum.readCount ?? 0;
    
    return {
      totalContacts,
      totalMessagesSent,
      totalMessagesRead,
      averageEngagementRate: totalMessagesSent > 0 
        ? Math.round((totalMessagesRead / totalMessagesSent) * 100) 
        : 0,
      topEngaged,
      inactive,
    };
  }

  /**
   * Obtém estatísticas de hoje
   */
  async getTodayStats(): Promise<{ sent: number; read: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const aggregate = await prisma.campaign.aggregate({
      where: {
        startedAt: { gte: today },
      },
      _sum: {
        sentCount: true,
        readCount: true,
      },
    });

    return {
      sent: aggregate._sum.sentCount ?? 0,
      read: aggregate._sum.readCount ?? 0,
    };
  }

  /**
   * Obtém dados formatados para os gráficos visuais (Recharts)
   */
  async getDashboardChartsData(): Promise<{
    funnel: Array<{ name: string; value: number }>;
    trends: Array<{ date: string; sent: number; read: number; responses: number }>;
  }> {
    // 1. Funil de Engajamento Global
    const [validContacts, totals] = await Promise.all([
      prisma.contactAnalytics.count(),
      prisma.contactAnalytics.aggregate({
        _sum: {
          sentCount: true,
          readCount: true,
        },
      }),
    ]);

    const totalSent = totals._sum.sentCount ?? 0;
    const totalReads = totals._sum.readCount ?? 0;
    
    // Fallback: se houver mais leituras que envios (bugs antigos), cap
    const normalizedReads = Math.min(totalReads, totalSent);
    
    const funnel = [
      { name: 'Contatos Válidos', value: validContacts },
      { name: 'Enviadas', value: totalSent },
      { name: 'Lidas', value: normalizedReads }
    ];

    // 2. Tendência dos últimos 7 dias (Trends) baseada nas Campanhas (History)
    // Extraímos das campanhas recentes para ter um baseline de dados reais.
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    const campaigns = await prisma.campaign.findMany({
      where: { startedAt: { gte: last7Days } },
      orderBy: { startedAt: 'asc' }
    });

    // Agrupar por dia
    const trendsMap = new Map<string, { sent: number; read: number; responses: number }>();
    
    // Inicializa últimos 7 dias com 0 para o gráfico não quebrar
    for (let i = 0; i < 7; i++) {
      const d = new Date(last7Days);
      d.setDate(d.getDate() + i);
      const dayStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      trendsMap.set(dayStr, { sent: 0, read: 0, responses: 0 });
    }

    campaigns.forEach((camp) => {
      const dayStr = camp.startedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const current = trendsMap.get(dayStr);
      if (current) {
        current.sent += camp.sentCount;
        current.read += camp.readCount;
        current.responses += camp.responseCount;
      }
    });

    const trends = Array.from(trendsMap.entries()).map(([date, data]) => ({
      date,
      sent: data.sent,
      read: data.read,
      responses: data.responses
    }));

    return { funnel, trends };
  }

  /**
   * Obtém métricas do WhatsAppService via API interna
   */
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
      // Importa dinamicamente para evitar ciclo de dependência
      const { getWhatsAppInstance } = await import("./whatsapp");
      const instance = getWhatsAppInstance();
      
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

// Singleton
let metricsServiceInstance: MetricsService | null = null;

export function getMetricsService(): MetricsService {
  if (!metricsServiceInstance) {
    metricsServiceInstance = new MetricsService();
  }
  return metricsServiceInstance;
}
