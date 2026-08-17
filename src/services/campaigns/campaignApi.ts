import { requestJson } from '@/services/http/client';

export interface CampaignRecord {
  id: string;
  name: string;
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  startedAt: string;
  completedAt: string | null;
}

export interface CreateCampaignPayload {
  name: string;
  templateName?: string;
  totalContacts: number;
}

export interface CompleteCampaignPayload {
  sentCount: number;
  failedCount: number;
}

export const campaignApi = {
  create: (payload: CreateCampaignPayload) => requestJson<CampaignRecord>('/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  complete: (id: string, payload: CompleteCampaignPayload) => requestJson(
    `/api/campaigns/${encodeURIComponent(id)}/complete`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  ),
};
