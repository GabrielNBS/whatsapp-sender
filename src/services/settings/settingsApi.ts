import { requestJson } from '@/services/http/client';
import type { OptOutFooterId } from '@/domain/opt-out-footer';

export interface GeneralSettingsPayload {
  defaultLink: string;
  defaultCTA: string;
  optOutFooterId: OptOutFooterId;
  optOutFooterEnabled: boolean;
}

export const settingsApi = {
  get: () => requestJson<Partial<GeneralSettingsPayload>>('/api/settings', { cache: 'no-store' }),
  update: (payload: GeneralSettingsPayload) => requestJson('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
};
