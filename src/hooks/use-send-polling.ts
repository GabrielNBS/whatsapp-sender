'use client';

import { useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { LogType } from '@/lib/types';
import { useGlobalSheet } from '@/components/dashboard/global-sheet-provider';
import { useAppLogger } from '@/hooks/use-app-logger';
import { requestJson } from '@/services/http/client';

interface CampaignStatusResponse {
  isSending: boolean;
  isPaused: boolean;
  isScheduled: boolean;
  progress: number;
  currentContactIndex: number;
  totalContacts: number;
  statusMessage: string | null;
  sentCount: number;
  failedCount: number;
  failedContacts: { name: string; number: string }[];
  failedContactsTruncated: boolean;
  logs: Array<{ message: string; type: LogType; timestamp: number }>;
  totalLogs: number;
}

const ACTIVE_POLLING_INTERVAL_MS = 2_000;
const IDLE_POLLING_INTERVAL_MS = 10_000;

/** Single global poller mounted by the dashboard layout. */
export function useSendPolling() {
  const setSendingStatus = useAppStore((state) => state.setSendingStatus);
  const pauseSending = useAppStore((state) => state.pauseSending);
  const finishSending = useAppStore((state) => state.finishSending);
  const isSending = useAppStore((state) => state.sendingStatus.isSending);
  const { openSheet } = useGlobalSheet();
  const addLog = useAppLogger();

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevIsSendingRef = useRef(false);
  const logOffsetRef = useRef(0);
  const inFlightRef = useRef(false);
  const warnedTruncatedFailedRef = useRef(false);

  const cleanupPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const getStatus = useCallback((includeFailures = false) => {
    const query = new URLSearchParams({
      logOffset: String(logOffsetRef.current),
      includeFailures: String(includeFailures),
    });
    return requestJson<CampaignStatusResponse>(`/api/campaigns/status?${query.toString()}`);
  }, []);

  const hydrateFailures = useCallback(async () => {
    try {
      const status = await getStatus(true);
      setSendingStatus({ failedContacts: status.failedContacts });
      if (status.failedContactsTruncated && !warnedTruncatedFailedRef.current) {
        warnedTruncatedFailedRef.current = true;
        addLog('Exibindo apenas parte das falhas para manter a interface responsiva.', 'warning');
      }
    } catch (error) {
      console.error('[useSendPolling] Failed to load failure details:', error);
    }
  }, [addLog, getStatus, setSendingStatus]);

  const pollStatus = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const status = await getStatus();
      logOffsetRef.current = status.totalLogs ?? logOffsetRef.current + status.logs.length;

      status.logs.forEach((log) => addLog(log.message, log.type));

      if (status.isScheduled) {
        cleanupPolling();
        setSendingStatus({
          isSending: false,
          isPaused: false,
          stoppedByUser: false,
          statusMessage: status.statusMessage || 'Agendado',
          progress: status.progress,
          currentContactIndex: status.currentContactIndex,
          totalContacts: status.totalContacts,
          sentCount: status.sentCount || 0,
          failedCount: status.failedCount || 0,
          failedContacts: [],
        });
        prevIsSendingRef.current = false;
        return;
      }

      if (!status.isSending && !status.isPaused) {
        cleanupPolling();
        finishSending({
          statusMessage: status.statusMessage || null,
          currentContactIndex: status.totalContacts || 0,
          totalContacts: status.totalContacts || 0,
          sentCount: status.sentCount || 0,
          failedCount: status.failedCount || 0,
          failedContacts: [],
        });

        if (status.failedCount > 0) void hydrateFailures();
        if (prevIsSendingRef.current) {
          toast.success('Transmissão finalizada!', {
            description: `${status.sentCount || 0} mensagens enviadas com sucesso.`,
            action: { label: 'Ver Histórico', onClick: () => openSheet('history') },
          });
          addLog('Transmissão finalizada!', 'success');
        }
        prevIsSendingRef.current = false;
        return;
      }

      if (status.isPaused) {
        cleanupPolling();
        pauseSending(status.statusMessage || 'Envio pausado.', {
          progress: status.progress || 0,
          currentContactIndex: status.currentContactIndex || 0,
          totalContacts: status.totalContacts || 0,
          sentCount: status.sentCount || 0,
          failedCount: status.failedCount || 0,
          failedContacts: [],
        });
        addLog('Envio pausado. Escolha retomar ou cancelar os pendentes.', 'warning');
        prevIsSendingRef.current = false;
        return;
      }

      if (!prevIsSendingRef.current) {
        toast.success('Transmissão iniciada!', { description: 'O sistema começou a enviar as mensagens.' });
        prevIsSendingRef.current = true;
      }
      setSendingStatus({
        isSending: true,
        isPaused: false,
        stoppedByUser: false,
        statusMessage: status.statusMessage,
        progress: status.progress,
        currentContactIndex: status.currentContactIndex,
        totalContacts: status.totalContacts,
        sentCount: status.sentCount || 0,
        failedCount: status.failedCount || 0,
        failedContacts: [],
      });
    } catch (error) {
      console.error('[useSendPolling] Polling error:', error);
    } finally {
      inFlightRef.current = false;
    }
  }, [addLog, cleanupPolling, finishSending, getStatus, hydrateFailures, openSheet, pauseSending, setSendingStatus]);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    void pollStatus();
    pollIntervalRef.current = setInterval(() => void pollStatus(), ACTIVE_POLLING_INTERVAL_MS);
  }, [pollStatus]);

  useEffect(() => {
    void pollStatus();
    const idleIntervalId = window.setInterval(() => {
      if (!pollIntervalRef.current && document.visibilityState === 'visible') void pollStatus();
    }, IDLE_POLLING_INTERVAL_MS);

    return () => {
      cleanupPolling();
      clearInterval(idleIntervalId);
    };
  }, [cleanupPolling, pollStatus]);

  useEffect(() => {
    if (isSending) startPolling();
  }, [isSending, startPolling]);

  return { startPolling, cleanupPolling };
}
