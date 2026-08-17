import type { RealtimeMetrics } from '@/lib/MetricsService';
import { requestJson } from '@/services/http/client';

export interface ContactAnalyticsRecord {
  sentCount: number;
  readCount: number;
  lastSentAt?: string | null;
  lastReadAt?: string | null;
}

export interface DashboardChartData {
  funnel: Array<{ name: string; value: number }>;
  trends: Array<{ date: string; sent: number; read: number; responses: number }>;
}

interface AnalyticsApiRecord extends ContactAnalyticsRecord {
  phone: string;
}

export const metricsApi = {
  getRealtime: (signal?: AbortSignal) => requestJson<RealtimeMetrics>('/api/metrics/realtime', {
    cache: 'no-store',
    signal,
  }),
  getCharts: () => requestJson<DashboardChartData>('/api/metrics/charts', { cache: 'no-store' }),
  getContactAnalytics: (phoneQuery: string, signal?: AbortSignal) => requestJson<AnalyticsApiRecord[]>(
    `/api/analytics?phones=${encodeURIComponent(phoneQuery)}`,
    { cache: 'no-store', signal },
  ),
};
