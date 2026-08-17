import { requestJson } from '@/services/http/client';

export const avatarApi = {
  get: (phone: string) => requestJson<{ url?: string | null }>(
    `/api/contacts/avatar?phone=${encodeURIComponent(phone)}`,
    { cache: 'no-store' },
  ),
};
