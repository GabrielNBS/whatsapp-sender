import { requestJson } from '@/services/http/client';

export interface ReportRecipient {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export interface ReportConfig {
  sendImmediate: boolean;
  sendEngagement: boolean;
  engagementDelayMins: number;
  engagementTimeFixed: string | null;
}

export interface ReportTestResult {
  success: boolean;
}

export interface ReportTestResponse {
  results?: ReportTestResult[];
}

export const reportsApi = {
  async getSettings(): Promise<{ recipients: ReportRecipient[]; config: ReportConfig }> {
    const [recipients, config] = await Promise.all([
      requestJson<ReportRecipient[]>('/api/reports/recipients', { cache: 'no-store' }),
      requestJson<ReportConfig>('/api/reports/config', { cache: 'no-store' }),
    ]);
    return { recipients, config };
  },
  addRecipient: (payload: Pick<ReportRecipient, 'name' | 'phone'>) => requestJson<ReportRecipient>('/api/reports/recipients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  updateRecipient: (id: string, payload: Pick<ReportRecipient, 'isActive'>) => requestJson<ReportRecipient>(
    `/api/reports/recipients/${encodeURIComponent(id)}`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
  ),
  removeRecipient: (id: string) => requestJson<{ success: boolean }>(
    `/api/reports/recipients/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  ),
  updateConfig: (updates: Partial<ReportConfig>) => requestJson<ReportConfig>('/api/reports/config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }),
  sendTest: () => requestJson<ReportTestResponse>('/api/reports/test', { method: 'POST' }),
};
