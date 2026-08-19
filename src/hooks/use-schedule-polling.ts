'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { FeedbackPort } from '@/presentation/feedback';
import { useAppLogger } from '@/hooks/use-app-logger';
import { refreshScheduleStore } from '@/lib/schedule-store';

const SCHEDULE_POLLING_INTERVAL_MS = 10_000;

export function useSchedulePolling(feedback: FeedbackPort) {
  const addLog = useAppLogger();
  const previousPendingIdsRef = useRef(new Set<string>());
  const toastedPausedIdsRef = useRef(new Set<string>());
  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const batches = await refreshScheduleStore();
      const pendingBatches = batches.filter((batch) => batch.count > 0 || batch.processing > 0 || (batch.paused ?? 0) > 0);
      const pendingIds = new Set(pendingBatches.map((batch) => batch.batchId));

      for (const batch of batches) {
        const completed = batch.count === 0 && batch.processing === 0 && (batch.paused ?? 0) === 0
          && batch.sent + batch.failed === batch.total;
        if (completed && previousPendingIdsRef.current.has(batch.batchId)) {
          addLog(
            batch.failed > 0
              ? `Agendamento concluído com ${batch.failed} falha(s).`
              : 'Agendamento concluído com sucesso!',
            batch.failed > 0 ? 'error' : 'success',
          );
        }

        if ((batch.paused ?? 0) > 0 && !toastedPausedIdsRef.current.has(batch.batchId)) {
          toastedPausedIdsRef.current.add(batch.batchId);
          feedback.notify(`Campanha "${batch.batchName}" foi interrompida com ${batch.paused} pendências.`, {
            duration: Infinity,
          });
        }
      }

      previousPendingIdsRef.current = pendingIds;
    } catch (error) {
      console.error('Failed to refresh schedules', error);
    } finally {
      inFlightRef.current = false;
    }
  }, [addLog, feedback]);

  useEffect(() => {
    void refresh();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, SCHEDULE_POLLING_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [refresh]);
}
