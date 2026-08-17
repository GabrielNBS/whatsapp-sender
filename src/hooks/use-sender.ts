import { useAppStore } from "@/lib/store";
import { Contact } from "@/lib/types";
import { nanoid } from "nanoid";
import { useAppLogger } from "@/hooks/use-app-logger";
import { requestJson } from "@/services/http/client";

export function useSender() {
  const setSendingStatus = useAppStore((state) => state.setSendingStatus);
  const startSending = useAppStore((state) => state.startSending);
  const pauseSending = useAppStore((state) => state.pauseSending);
  const resetSending = useAppStore((state) => state.resetSending);
  const addLog = useAppLogger();

  const handleStop = async () => {
    try {
      await requestJson('/api/campaigns/stop', { method: 'POST' });

      pauseSending('Envio pausado pelo usuário.');
      addLog("Envio interrompido pelo usuário.", "warning");
    } catch {
      addLog("Erro ao interromper o envio.", "error");
    }
  };

  const handleSend = async (
    recipients: Contact[],
    message: string,
    selectedFile: { mimetype: string; data: string; filename?: string } | null,
    campaignName: string
  ): Promise<boolean> => {
    if ((!message && !selectedFile) || recipients.length === 0) return false;

    startSending(recipients.length);

    try {
      const status = await requestJson<{ isSending: boolean; isPaused: boolean; statusMessage?: string | null }>('/api/campaigns/status');
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

        await requestJson('/api/campaigns/stop', { method: 'POST' });
        addLog('Transmissao atual pausada para iniciar uma nova.', 'warning');
        }

      const idempotencyKey = nanoid();

      await requestJson("/api/campaigns/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          idempotencyKey,
          recipients,
          message,
          media: selectedFile,
        }),
      });

      // Polling is handled by useSendPolling at layout level — it will
      // detect isSending on next tick and start observing automatically.
      return true;
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Erro desconhecido";
      addLog(`Falha ao iniciar: ${errMessage}`, "error");
      
      // Importante: Mostrar o erro para o usuário via toast
      import("sonner").then(({ toast }) => {
        toast.error(`Erro ao iniciar envio: ${errMessage}`);
      });
      
      resetSending();
      return false;
    }
  };

  return {
    handleSend,
    handleStop,
  };
}
