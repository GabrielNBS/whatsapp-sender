import { requestJson } from '@/services/http/client';

export interface GeneralSettingsPayload {
  defaultLink: string;
  defaultCTA: string;
}

export const settingsApi = {
  get: () => requestJson<Partial<GeneralSettingsPayload>>('/api/settings', { cache: 'no-store' }),
  update: (payload: GeneralSettingsPayload) => requestJson('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
};
