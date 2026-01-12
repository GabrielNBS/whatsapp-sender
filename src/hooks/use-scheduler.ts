

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
                
                // Detection of completed batches
                const currentBatchIds = new Set(data.map(b => b.batchId));
                
                // Check if any batch from previous fetch is MISSING now (meaning it completed, since API only returns active)
                // Note: Our modified API returns batches that have at least 1 pending. 
                // So if it disappears, it means it has 0 pending = Completed.
                
                prevBatchesRef.current.forEach(prevId => {
                    if (!currentBatchIds.has(prevId)) {
                        // Batch ID prevId disappeared -> Completed!
                        // We don't have the Name here easily unless we stored it. 
                        // For simplicity, just log generic or we could improve this by storing map.
                        addLog(`Um agendamento foi concluído!`, 'success', Date.now() + 3 * 60 * 60 * 1000); // 3 hours
                    }
                });

                prevBatchesRef.current = currentBatchIds;
                setActiveSchedules(data);
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
