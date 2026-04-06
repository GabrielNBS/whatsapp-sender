

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { nanoid } from 'nanoid';
import { ScheduledBatch, LogType } from '@/lib/types';
import { toast } from 'sonner';

export function useScheduler() {
    const { addLog: storeAddLog } = useAppStore();
    const [activeSchedules, setActiveSchedules] = useState<ScheduledBatch[]>([]);
    
    // Track previous batches to detect completion
    const prevBatchesRef = useRef<Set<string>>(new Set());
    const toastedPausedRef = useRef<Set<string>>(new Set());

    const addLog = (message: string, type: LogType = 'info', expiresAt?: number) => {
        storeAddLog({
            id: nanoid(),
            message,
            type,
            timestamp: new Date(),
            expiresAt
        });
    };

    const fetchSchedules = async () => {
        try {
            const res = await fetch('/api/schedule');
            if (res.ok) {
                const data: ScheduledBatch[] = await res.json();
                
                // Filter for UI display (only show active/pending batches)
                const pendingBatches = data.filter(b => b.count > 0);
                
                // Detect completion by checking batches that were pending and are now zero-pending (completed)
                // OR batches that purely disappeared (fallback, though API now returns recent completed)
                const currentPendingIds = new Set(pendingBatches.map(b => b.batchId));
                
                // Check for batches that finished in this tick (present in data but count == 0)
                data.forEach(batch => {
                    if (batch.count === 0 && prevBatchesRef.current.has(batch.batchId)) {
                        // Was pending, now done
                        if (batch.failed > 0) {
                            addLog(`Agendamento concluído com ${batch.failed} falha(s).`, 'error');
                        } else {
                            addLog(`Agendamento concluído com sucesso!`, 'success');
                        }
                    }
                });

                // Check for disappeared batches (fallback for edges)
                prevBatchesRef.current.forEach(prevId => {
                    if (!data.find(b => b.batchId === prevId)) {
                        // Completely gone from API (older than 10m?)
                         addLog(`Agendamento finalizado.`, 'info');
                    }
                });

                prevBatchesRef.current = currentPendingIds;
                setActiveSchedules(pendingBatches);

                // Check for paused batches and prompt via Sonner
                const pausedBatches = data.filter(b => (b.paused ?? 0) > 0);
                pausedBatches.forEach(batch => {
                    if (!toastedPausedRef.current.has(batch.batchId)) {
                        toastedPausedRef.current.add(batch.batchId);
                        toast(`Campanha "${batch.batchName}" foi interrompida com ${batch.paused} pendências.`, {
                            duration: Infinity,
                            action: {
                                label: 'Retomar Envio',
                                onClick: () => handleConfirmStale(batch, true)
                            },
                            cancel: {
                                label: 'Cancelar Envios',
                                onClick: () => handleConfirmStale(batch, false)
                            }
                        });
                    }
                });
            }
        } catch {
            console.error("Failed to fetch schedules");
        }
    };


    const handleCancelSchedule = async (batchId: string) => {
        try {
            await fetch(`/api/schedule?batchId=${batchId}`, { method: 'DELETE' });
            fetchSchedules();
            addLog('Agendamento cancelado.', 'warning');
        } catch {
            addLog('Erro ao cancelar agendamento.', 'error');
        }
    };

    const handleConfirmStale = async (batch: ScheduledBatch, keep: boolean) => {
        if (!batch) return;

        if (keep) {
            try {
                await fetch('/api/schedule', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        batchId: batch.batchId,
                        newDate: new Date().toISOString()
                    })
                });
                toast.success('Envio retomado com sucesso!');
                addLog('Agendamento atrasado atualizado para envio imediato.', 'info');
            } catch {
                toast.error('Erro ao retomar o envio.');
                addLog('Erro ao atualizar agendamento.', 'error');
            }
        } else {
            await handleCancelSchedule(batch.batchId);
            toast.info('Envios da campanha cancelados.');
            addLog('Agendamento atrasado cancelado automaticamente.', 'warning');
        }
        fetchSchedules();
    };

    // Polling effect
    useEffect(() => {
        fetchSchedules();
        const interval = setInterval(fetchSchedules, 10000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        activeSchedules,
        fetchSchedules,
        handleCancelSchedule,
    };
}
