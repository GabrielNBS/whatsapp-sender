import { useAppStore } from "@/lib/store";
import { calculateSafetyDelay } from "@/lib/utils";
import { nanoid } from "nanoid";
import { Contact, LogType } from "@/lib/types";

import { useRef, useCallback } from "react";

// Campaign tracking
interface CampaignMetrics {
  campaignId: string | null;
  sentCount: number;
  failedCount: number;
}

export function useSender() {
  const { setSendingStatus, addLog: storeAddLog } = useAppStore();

  // Safety Refs
  const abortRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Campaign tracking ref
  const metricsRef = useRef<CampaignMetrics>({
    campaignId: null,
    sentCount: 0,
    failedCount: 0,
  });

  const addLog = (message: string, type: LogType = "info") => {
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
  };

  const cleanup = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  };

  // Create campaign at start
  const createCampaign = useCallback(
    async (name: string, totalContacts: number): Promise<string | null> => {
      try {
        console.log("[useSender] Creating campaign:", name);
        const res = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            totalContacts,
          }),
        });

        if (res.ok) {
          const campaign = await res.json();
          console.log("[useSender] Campaign created:", campaign.id);
          return campaign.id;
        } else {
          console.error("[useSender] Failed to create campaign");
          return null;
        }
      } catch (error) {
        console.error("[useSender] Error creating campaign:", error);
        return null;
      }
    },
    [],
  );

  // Complete campaign and trigger report
  const completeCampaign = useCallback(async () => {
    const { campaignId, sentCount, failedCount } = metricsRef.current;

    if (!campaignId) {
      console.log("[useSender] No campaign to complete");
      return;
    }

    try {
      console.log("[useSender] Completing campaign:", campaignId, {
        sentCount,
        failedCount,
      });
      const res = await fetch(`/api/campaigns/${campaignId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentCount, failedCount }),
      });

      if (res.ok) {
        const result = await res.json();
        console.log(
          "[useSender] Campaign completed, report sent:",
          result.reportSent,
        );
        if (result.reportSent) {
          addLog("📊 Relatório enviado para gestores!", "success");
        }
      } else {
        console.error("[useSender] Failed to complete campaign");
      }
    } catch (error) {
      console.error("[useSender] Error completing campaign:", error);
    } finally {
      // Reset metrics for next campaign
      metricsRef.current = { campaignId: null, sentCount: 0, failedCount: 0 };
    }
  }, []);

  const handleStop = () => {
    if (abortRef.current) return;

    abortRef.current = true;
    cleanup();

    setSendingStatus({
      isSending: false,
      statusMessage: null,
      totalContacts: 0,
    });
    addLog("Envio interrompido pelo usuário.", "warning");

    // Complete campaign even if stopped early
    completeCampaign();
  };

  const processQueue = async (
    index: number,
    recipients: Contact[],
    message: string,
    selectedFile: any | null,
  ) => {
    if (abortRef.current) return;

    if (index >= recipients.length) {
      setSendingStatus({
        isSending: false,
        statusMessage: null,
        progress: 100,
        currentContactIndex: recipients.length,
      });
      addLog("Transmissão completa!", "success");

      // Complete campaign and send report
      await completeCampaign();
      return;
    }

    const contact = recipients[index];
    setSendingStatus({
      currentContactIndex: index,
      progress: Math.round((index / recipients.length) * 100),
    });

    try {
      if (abortRef.current) return;
      setSendingStatus({
        statusMessage: `Enviando para ${contact.name} (${contact.number})...`,
      });

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: contact.number,
          message: message,
          media: selectedFile,
          name: contact.name,
        }),
      });

      if (abortRef.current) return;

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha ao enviar");
      }

      // Track success
      metricsRef.current.sentCount++;

      addLog(`Enviado para ${contact.name}`, "success");

      const nextContact = recipients[index + 1];

      if (nextContact) {
        const delay = calculateSafetyDelay();
        const nextName = nextContact.name.split(" ")[0];

        let remaining = Math.ceil(delay / 1000);
        if (abortRef.current) return;

        setSendingStatus({
          statusMessage: `Aguardando ${remaining}s para enviar para ${nextName}...`,
        });

        intervalRef.current = setInterval(() => {
          if (abortRef.current) {
            cleanup();
            return;
          }
          remaining -= 1;
          if (remaining > 0) {
            setSendingStatus({
              statusMessage: `Aguardando ${remaining}s para enviar para ${nextName}...`,
            });
          }
        }, 1000);

        timeoutRef.current = setTimeout(() => {
          cleanup();
          if (!abortRef.current) {
            processQueue(index + 1, recipients, message, selectedFile);
          }
        }, delay);
      } else {
        processQueue(index + 1, recipients, message, selectedFile);
      }
    } catch (error) {
      if (abortRef.current) return;
      console.error(error);

      // Track failure
      metricsRef.current.failedCount++;

      addLog(`Erro ao enviar para ${contact.name}: ${error}`, "error");

      timeoutRef.current = setTimeout(() => {
        if (!abortRef.current) {
          processQueue(index + 1, recipients, message, selectedFile);
        }
      }, 5000);
    }
  };

  const handleSend = async (
    recipients: Contact[],
    message: string,
    selectedFile: any | null,
  ): Promise<boolean> => {
    if ((!message && !selectedFile) || recipients.length === 0) return false;

    // Reset state
    abortRef.current = false;
    cleanup();

    // Reset metrics
    metricsRef.current = { campaignId: null, sentCount: 0, failedCount: 0 };

    // Create campaign for tracking
    const campaignName = `Campanha ${new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    const campaignId = await createCampaign(campaignName, recipients.length);
    metricsRef.current.campaignId = campaignId;

    setSendingStatus({
      isSending: true,
      statusMessage: "Iniciando transmissão...",
      progress: 0,
      currentContactIndex: 0,
      totalContacts: recipients.length,
    });
    processQueue(0, recipients, message, selectedFile);

    return true;
  };

  return {
    handleSend,
    handleStop,
  };
}
