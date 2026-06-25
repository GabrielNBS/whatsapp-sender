import { prisma } from '@/lib/db';
import { getMetricsService } from '@/lib/MetricsService';
import { checkRateLimit } from '@/lib/rate-limit';
import { API_RATE_LIMITS, API_MAX_PAGE_SIZE } from '@/constants/api';

export const MetricsQueryService = {
  /**
   * Obtém a lista de engajamento/analytics dos contatos com limites seguros de paginação.
   */
  async getContactAnalytics(limit: number = 50, offset: number = 0) {
    const safeLimit = Math.min(limit, API_MAX_PAGE_SIZE);
    
    return prisma.contactAnalytics.findMany({
      take: safeLimit,
      skip: offset,
      orderBy: { updatedAt: 'desc' },
    });
  },

  /**
   * Obtém as métricas em tempo real aplicando rate-limit de polling.
   */
  async getRealtimeMetrics(clientIp: string) {
    // Aplica rate limit por IP cliente para consultas de polling agressivo (API-011)
    checkRateLimit(
      `metrics-realtime-${clientIp}`, 
      API_RATE_LIMITS.POLLING_LIMIT, 
      API_RATE_LIMITS.POLLING_WINDOW_MS
    );

    const metricsService = getMetricsService();
    return metricsService.getRealtimeMetrics();
  },

  /**
   * Obtém os dados de gráficos agregados do dashboard.
   */
  async getDashboardChartsData() {
    const metricsService = getMetricsService();
    return metricsService.getDashboardChartsData();
  },
};
export default MetricsQueryService;
