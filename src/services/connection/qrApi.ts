import { requestJson } from '@/services/http/client';

export interface QrStatusResponse {
  qr: string | null;
  status: { status: string; isAuthenticated: boolean; error: string | null };
}

export const qrApi = {
  getStatus: () => requestJson<QrStatusResponse>('/api/qr', { cache: 'no-store' }),
};
