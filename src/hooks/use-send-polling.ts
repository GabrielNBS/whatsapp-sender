'use client';

import { useAppStore } from "@/lib/store";
import { LogType } from "@/lib/types";
import { nanoid } from "nanoid";
import { useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useGlobalSheet } from "@/components/dashboard/global-sheet-provider";

/**
 * Global polling hook that keeps sendingStatus in sync with the backend.
 */
export function useSendPolling() {
  const { setSendingStatus, addLog: storeAddLog } = useAppStore();
  const { openSheet } = useGlobalSheet();

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevIsSendingRef = useRef(false);
  const logOffsetRef = useRef(0);

  const addLog = useCallback((message: string, type: LogType = "info") => {
    let expiresAt = undefined;
    if (type === "success") {
      expiresAt = Date.now() + 10 * 60 * 1000;
    }
    storeAddLog({
      id: nanoid(),
      message,
      type,
      timestamp: new Date(),
      expiresAt,
    });
  }, [storeAddLog]);

  const cleanupPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/status?logOffset=${logOffsetRef.current}`);
      if (res.ok) {
        const status = await res.json();

        if (status.totalLogs !== undefined) {
          logOffsetRef.current = status.totalLogs;
        } else if (status.logs && status.logs.length > 0) {
          logOffsetRef.current += status.logs.length;
        }

        if (status.logs && status.logs.length > 0) {
          status.logs.forEach((log: { message: string; type: LogType; timestamp: number }) => {
            addLog(log.message, log.type);
          });
        }

        // Backend stopped but frontend thought it was sending
        if (!status.isSending && pollIntervalRef.current) {
          cleanupPolling();
          setSendingStatus({
            isSending: false,
            statusMessage: status.statusMessage || null,
            progress: 100,
            currentContactIndex: status.totalContacts || 0,
            failedContacts: status.failedContacts || [],
            sentCount: status.sentCount || 0,
            failedCount: status.failedCount || 0,
            isPaused: false,
          });
          
          if (prevIsSendingRef.current) {
            toast.success("Transmissão finalizada!", {
              description: `${status.sentCount || 0} mensagens enviadas com sucesso.`,
              action: {
                label: "Ver Histórico",
                onClick: () => openSheet('history')
              }
            });
            prevIsSendingRef.current = false;
          }

          addLog("Transmissão finalizada!", "success");
          return;
        }

        // Backend is still sending
        if (status.isSending) {
          if (!prevIsSendingRef.current) {
            toast.success("Transmissão iniciada!", {
              description: "O sistema começou a enviar as mensagens."
            });
            prevIsSendingRef.current = true;
          }
          setSendingStatus({
            isSending: true,
            statusMessage: status.statusMessage,
            progress: status.progress,
            currentContactIndex: status.currentContactIndex,
            totalContacts: status.totalContacts,
            failedContacts: status.failedContacts || [],
            sentCount: status.sentCount || 0,
            failedCount: status.failedCount || 0,
            stoppedByUser: false,
            isPaused: !!status.isPaused,
          });
        }
      }
    } catch (error) {
      console.error('[useSendPolling] Polling error:', error);
    }
  }, [setSendingStatus, addLog, cleanupPolling, openSheet]);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return; // Already polling
    logOffsetRef.current = 0;
    pollStatus();
    pollIntervalRef.current = setInterval(pollStatus, 2000);
  }, [pollStatus]);

  // On mount: check if backend has an active campaign and re-engage polling
  useEffect(() => {
    fetch('/api/campaigns/status')
      .then(r => r.json())
      .then(status => {
        if (status.isSending && !pollIntervalRef.current) {
          pollStatus();
          pollIntervalRef.current = setInterval(pollStatus, 2000);
        }
      })
      .catch(console.error);

    return cleanupPolling;
  }, [pollStatus, cleanupPolling]);

  // Background slow polling for scheduled campaigns
  useEffect(() => {
    let slowPollInterval: NodeJS.Timeout | null = null;
    const isSendingGlobal = useAppStore.getState().sendingStatus.isSending;
    
    if (!isSendingGlobal) {
      slowPollInterval = setInterval(async () => {
        try {
          const res = await fetch('/api/campaigns/status');
          if (res.ok) {
            const status = await res.json();
            if (status.isSending) {
              // A scheduled campaign started! Wake up the fast poller.
              pollStatus();
            }
          }
        } catch {
          // ignore background errors
        }
      }, 10000); // 10 seconds check
    }

    return () => {
      if (slowPollInterval) clearInterval(slowPollInterval);
    };
  }, [pollStatus]);

  // Auto-start polling when sendingStatus.isSending becomes true (e.g. after handleSend)
  const isSending = useAppStore((s) => s.sendingStatus.isSending);
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isSending && !pollIntervalRef.current) {
      // Delay polling by 1.5 seconds to avoid race conditions with POST /start
      timeoutId = setTimeout(() => {
        startPolling();
      }, 1500);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isSending, startPolling]);

  return { startPolling, cleanupPolling };
}
