import type { ScheduleBatchSummary } from '@/lib/types';
import { requestJson } from '@/services/http/client';

export interface ScheduleRequest {
  recipients: Array<{ name: string; number: string }>;
  message: string;
  media: { data: string; mimetype: string; filename: string } | null;
  scheduledFor: string;
  batchName: string;
  templateId: string | null;
}

export interface ScheduleResult {
  success: boolean;
  batchId: string;
  count: number;
}

export const scheduleApi = {
  listSummary(signal?: AbortSignal) {
    return requestJson<ScheduleBatchSummary[]>('/api/schedule', { cache: 'no-store', signal });
  },

  create(payload: ScheduleRequest) {
    return requestJson<ScheduleResult>('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  cancel(batchId: string) {
    return requestJson<{ success: boolean; canceledCount: number }>(
      `/api/schedule?batchId=${encodeURIComponent(batchId)}`,
      { method: 'DELETE' },
    );
  },

  resume(batchId: string) {
    return requestJson<{ success: boolean; rescheduledCount: number }>(
      `/api/schedule/${encodeURIComponent(batchId)}/reschedule`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor: new Date().toISOString() }),
      },
    );
  },
};
