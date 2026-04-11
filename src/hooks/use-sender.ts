import { useAppStore } from "@/lib/store";
import { Contact, LogType } from "@/lib/types";
import { nanoid } from "nanoid";
import { useCallback } from "react";

export function useSender() {
  const { setSendingStatus, addLog: storeAddLog } = useAppStore();

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

  const handleStop = async () => {
    try {
      await fetch('/api/campaigns/stop', { method: 'POST' });

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
      const statusRes = await fetch('/api/campaigns/status');
      if (statusRes.ok) {
        const status = await statusRes.json();
        if (status.isSending || status.isPaused) {
          const cancelCurrent = window.confirm(
            status.isSending
              ? 'Ja existe uma transmissao em andamento. Clique OK para cancelar a atual e iniciar a nova. Clique Cancelar para continuar a atual.'
              : 'Existe uma transmissao pausada. Clique OK para cancelar a pausada e iniciar uma nova. Clique Cancelar para manter a pausada.'
          );

          if (!cancelCurrent) {
            setSendingStatus({
              isSending: true,
              statusMessage: status.statusMessage || 'Continuando transmissao atual...',
              isPaused: !!status.isPaused,
            });
            addLog('Transmissao atual mantida.', 'info');
            return false;
          }

          await fetch('/api/campaigns/stop', { method: 'POST' });
          addLog('Transmissao atual pausada para iniciar uma nova.', 'warning');
        }
      }

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

      // Polling is handled by useSendPolling at layout level — it will
      // detect isSending on next tick and start observing automatically.
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
