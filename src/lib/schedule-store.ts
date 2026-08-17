import { create } from 'zustand';
import type { ScheduleBatchSummary } from '@/lib/types';
import { scheduleApi } from '@/services/schedules/scheduleApi';

export function splitScheduleBatches(batches: ScheduleBatchSummary[]) {
  return {
    completedSchedules: batches.filter((batch) =>
      batch.count === 0
      && batch.processing === 0
      && (batch.paused ?? 0) === 0
      && batch.sent + batch.failed === batch.total,
    ),
    activeSchedules: batches.filter(
      (batch) => batch.count > 0 || batch.processing > 0 || (batch.paused ?? 0) > 0,
    ),
  };
}

interface ScheduleStore {
  activeSchedules: ScheduleBatchSummary[];
  completedSchedules: ScheduleBatchSummary[];
  setBatches: (batches: ScheduleBatchSummary[]) => void;
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  activeSchedules: [],
  completedSchedules: [],
  setBatches: (batches) => set(splitScheduleBatches(batches)),
}));

export async function refreshScheduleStore(signal?: AbortSignal) {
  const batches = await scheduleApi.listSummary(signal);
  useScheduleStore.getState().setBatches(batches);
  return batches;
}
