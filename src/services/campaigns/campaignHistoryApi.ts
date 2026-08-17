import { requestJson } from '@/services/http/client';

export interface FailedCampaignRecipient {
  contactName: string;
  contactPhone: string;
}

export interface CampaignHistorySummary {
  id: string;
  name: string;
  startedAt: string;
  completedAt: string | null;
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  readCount: number;
  responseCount: number;
}

export interface CampaignHistoryItem extends CampaignHistorySummary {
  failedDetails: FailedCampaignRecipient[];
  templateTitle?: string;
  templateContent?: string;
  templateMedia?: string | null;
}

export const campaignHistoryApi = {
  list: () => requestJson<CampaignHistorySummary[]>('/api/campaigns/history', { cache: 'no-store' }),
  get: (id: string) => requestJson<CampaignHistoryItem>(
    `/api/campaigns/history/${encodeURIComponent(id)}`,
    { cache: 'no-store' },
  ),
};
