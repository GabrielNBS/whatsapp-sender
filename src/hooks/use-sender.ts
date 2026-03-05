import { useAppStore } from "@/lib/store";
import { Contact, LogType } from "@/lib/types";
import { nanoid } from "nanoid";
import { useRef, useCallback, useEffect } from "react";

export function useSender() {
  const { setSendingStatus, addLog: storeAddLog } = useAppStore();

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logOffsetRef = useRef(0);

  const addLog = useCallback((message: string, type: LogType = "info") => {
    let expiresAt = undefined;
    if (type === "success") {
      expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
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

  // Sync state with backend QueueService
  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/status?logOffset=${logOffsetRef.current}`);
      if (res.ok) {
        const status = await res.json();
        
        if (status.logs && status.logs.length > 0) {
          status.logs.forEach((log: { message: string, type: LogType, timestamp: number }) => {
            addLog(log.message, log.type);
          });
          logOffsetRef.current += status.logs.length;
        }
        
        // Se a fila do backend parou mas nosso frontend achava que tava enviando
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
          addLog("Transmissão finalizada!", "success");
          return;
        }

        // Se a fila do backend está rodando
        if (status.isSending) {
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
      console.error('[useSender] Polling error:', error);
    }
  }, [setSendingStatus, addLog, cleanupPolling]);

  // Handle sudden refresh: se a tela carregar, vamos ver se a fila está rodando no backend
  useEffect(() => {
    fetch('/api/campaigns/status')
      .then(r => r.json())
      .then(status => {
        if (status.isSending && !pollIntervalRef.current) {
          // Re-engajar o overlay
          pollStatus();
          pollIntervalRef.current = setInterval(pollStatus, 2000);
        }
      })
      .catch(console.error);
      
    return cleanupPolling;
  }, [pollStatus, cleanupPolling]);

  const handleStop = async () => {
    try {
      await fetch('/api/campaigns/stop', { method: 'POST' });
      cleanupPolling();
      
      setSendingStatus({
        isSending: false,
        statusMessage: null,
        stoppedByUser: true,
      });
      addLog("Envio interrompido pelo usuário.", "warning");
    } catch {
      addLog("Erro ao interromper o envio.", "error");
    }
  };

  const handleSend = async (
    recipients: Contact[],
    message: string,
    selectedFile: { mimetype: string; data: string; filename?: string } | null,
  ): Promise<boolean> => {
    if ((!message && !selectedFile) || recipients.length === 0) return false;

    // Reset log offset for new campaign
    logOffsetRef.current = 0;
    
    // Call the backend to start
    setSendingStatus({
      isSending: true,
      statusMessage: "Iniciando transmissão no servidor...",
      progress: 0,
      currentContactIndex: 0,
      totalContacts: recipients.length,
      failedContacts: [],
      sentCount: 0,
      failedCount: 0,
      stoppedByUser: false,
      isPaused: false,
    });

    try {
      const res = await fetch("/api/campaigns/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          message,
          media: selectedFile,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao iniciar na API");
      }

      // Start observing the queue
      cleanupPolling();
      pollIntervalRef.current = setInterval(pollStatus, 2000);

      return true;
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Erro desconhecido";
      addLog(`Falha ao iniciar: ${errMessage}`, "error");
      setSendingStatus({ isSending: false, statusMessage: null });
      return false;
    }
  };

  return {
    handleSend,
    handleStop,
  };
}
