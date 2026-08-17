'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { useAppLogger } from '@/hooks/use-app-logger';
import { refreshScheduleStore, useScheduleStore } from '@/lib/schedule-store';
import { scheduleApi } from '@/services/schedules/scheduleApi';
import type { ScheduleBatchSummary } from '@/lib/types';

export function useScheduler() {
  const { activeSchedules, completedSchedules } = useScheduleStore(useShallow((state) => ({
    activeSchedules: state.activeSchedules,
    completedSchedules: state.completedSchedules,
  })));
  const addLog = useAppLogger();

  const fetchSchedules = useCallback(async () => {
    try {
      await refreshScheduleStore();
    } catch (error) {
      console.error('Failed to fetch schedules', error);
    }
  }, []);

  const handleCancelSchedule = useCallback(async (batchId: string) => {
    try {
      await scheduleApi.cancel(batchId);
      await refreshScheduleStore();
      addLog('Agendamento cancelado.', 'warning');
    } catch (error) {
      addLog(error instanceof Error ? error.message : 'Erro ao cancelar agendamento.', 'error');
    }
  }, [addLog]);

  const handleConfirmStale = useCallback(async (batch: ScheduleBatchSummary, keep: boolean) => {
    try {
      if (keep) {
        await scheduleApi.resume(batch.batchId);
        toast.success('Envio retomado com sucesso!');
        addLog('Agendamento atrasado atualizado para envio imediato.', 'info');
      } else {
        await scheduleApi.cancel(batch.batchId);
        toast.info('Envios da campanha cancelados.');
        addLog('Agendamento atrasado cancelado automaticamente.', 'warning');
      }
      await refreshScheduleStore();
    } catch (error) {
      const message = keep ? 'Erro ao retomar o envio.' : 'Erro ao cancelar agendamento.';
      toast.error(message);
      addLog(error instanceof Error ? error.message : message, 'error');
    }
  }, [addLog]);

  return {
    activeSchedules,
    completedSchedules,
    fetchSchedules,
    handleCancelSchedule,
    handleConfirmStale,
  };
}
