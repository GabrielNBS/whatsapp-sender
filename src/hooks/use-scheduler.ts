

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { nanoid } from 'nanoid';
import { ScheduledBatch, LogType } from '@/lib/types';

export function useScheduler() {
    const { addLog: storeAddLog } = useAppStore();
    const [activeSchedules, setActiveSchedules] = useState<ScheduledBatch[]>([]);
    const [staleBatch, setStaleBatch] = useState<ScheduledBatch | null>(null);
    
    // Track previous batches to detect completion
    const prevBatchesRef = useRef<Set<string>>(new Set());

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
            }
        } catch (error) {
            console.error("Failed to fetch schedules", error);
        }
    };


    const handleCancelSchedule = async (batchId: string) => {
        try {
            await fetch(`/api/schedule?batchId=${batchId}`, { method: 'DELETE' });
            fetchSchedules();
            addLog('Agendamento cancelado.', 'warning');
        } catch (error) {
            addLog('Erro ao cancelar agendamento.', 'error');
        }
    };

    const handleConfirmStale = async (keep: boolean) => {
        if (!staleBatch) return;

        if (keep) {
            try {
                await fetch('/api/schedule', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        batchId: staleBatch.batchId, // Ensure we use correct ID field from ScheduledBatch type
                        newDate: new Date().toISOString()
                    })
                });
                addLog('Agendamento atrasado atualizado para envio imediato.', 'info');
            } catch (e) {
                addLog('Erro ao atualizar agendamento.', 'error');
            }
        } else {
            await handleCancelSchedule(staleBatch.batchId);
            addLog('Agendamento atrasado cancelado automaticamente.', 'warning');
        }
        setStaleBatch(null);
        fetchSchedules();
    };

    // Stale check effect
    useEffect(() => {
        if (activeSchedules.length > 0) {
            const now = new Date();
            const stale = activeSchedules.find(batch => {
                const batchDate = new Date(batch.scheduledFor);
                return (now.getTime() - batchDate.getTime()) > 60 * 60 * 1000;
            });

            if (stale) {
                setStaleBatch(stale);
            }
        }
    }, [activeSchedules]);

    // Polling effect
    useEffect(() => {
        fetchSchedules();
        const interval = setInterval(fetchSchedules, 10000);
        return () => clearInterval(interval);
    }, []);

    return {
        activeSchedules,
        staleBatch,
        fetchSchedules,
        handleCancelSchedule,
        handleConfirmStale
    };
}
