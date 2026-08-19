import { prisma } from '@/lib/db';
import { getMetricsService } from '@/lib/MetricsService';
import { checkRateLimit } from '@/lib/rate-limit';
import { API_RATE_LIMITS, API_MAX_PAGE_SIZE } from '@/constants/api';

export const MetricsQueryService = {
  /**
   * Obtém a lista de engajamento/analytics dos contatos com limites seguros de paginação.
   */
  async getContactAnalytics(limit: number, offset: number, workspaceId: string) {
    const safeLimit = Math.min(limit, API_MAX_PAGE_SIZE);
    
    return prisma.contactAnalytics.findMany({
      where: { workspaceId },
      take: safeLimit,
      skip: offset,
      orderBy: { updatedAt: 'desc' },
    });
  },

  /**
   * Obtém as métricas em tempo real aplicando rate-limit de polling.
   */
  async getRealtimeMetrics(clientIp: string, workspaceId: string) {
    // Aplica rate limit por IP cliente para consultas de polling agressivo (API-011)
    checkRateLimit(
      `metrics-realtime-${workspaceId}-${clientIp}`,
      API_RATE_LIMITS.POLLING_LIMIT, 
      API_RATE_LIMITS.POLLING_WINDOW_MS
    );

    const metricsService = getMetricsService(workspaceId);
    return metricsService.getRealtimeMetrics();
  },

  async getConnectionStatus(clientIp: string, workspaceId: string) {
    checkRateLimit(
      `connection-status-${workspaceId}-${clientIp}`,
      API_RATE_LIMITS.POLLING_LIMIT,
      API_RATE_LIMITS.POLLING_WINDOW_MS,
    );

    return getMetricsService(workspaceId).getConnectionStatus();
  },

  /**
   * Obtém os dados de gráficos agregados do dashboard.
   */
  async getDashboardChartsData(workspaceId: string) {
    const metricsService = getMetricsService(workspaceId);
    return metricsService.getDashboardChartsData();
  },
};
export default MetricsQueryService;
