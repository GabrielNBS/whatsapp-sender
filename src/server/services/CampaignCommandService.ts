import { getCampaignService } from "@/lib/CampaignService";
import { getQueueService } from "@/lib/QueueService";
import { getReportService } from "@/lib/ReportService";
import { getWhatsAppInstance } from "@/lib/whatsapp";
import type { CompleteCampaignCommand, StartCampaignCommand } from '@/domain/contracts';
import { ConflictError, NotFoundError } from "@/lib/api-errors";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/services/contacts/normalizePhone";
import { beginIdempotentOperation } from "@/lib/idempotency";
import { getContactConsentService } from "@/server/services/ContactConsentService";

type CampaignMedia = NonNullable<StartCampaignCommand["media"]>;

export const CampaignCommandService = {
  async startCampaign(data: StartCampaignCommand, workspaceId: string) {
    const queueService = getQueueService(workspaceId);
    const campaignService = getCampaignService(workspaceId);
    const reservation = await beginIdempotentOperation(workspaceId, data.idempotencyKey);
    let campaignQueued = false;

    try {
      const activeStatus = await queueService.getStatus(0);
      if (activeStatus.isSending || activeStatus.isPaused || activeStatus.isScheduled) {
        throw new ConflictError("Ja existe uma campanha agendada, pausada ou em andamento.");
      }

      let campaignMessage = data.message || "";
      let campaignMedia: CampaignMedia | null = data.media || null;

      if (data.templateId) {
        const template = await prisma.template.findFirst({
          where: { id: data.templateId, workspaceId },
        });
        if (!template) throw new NotFoundError('Template não encontrado neste workspace.');
        campaignMessage = template.content;
        campaignMedia = template.media ? JSON.parse(template.media as string) as CampaignMedia : null;
      }

      await getContactConsentService().assertRecipientsCanBeMessaged(data.recipients, workspaceId);

      const normalizedNumbers = data.recipients.map((recipient) => normalizePhone(recipient.number));
      const knownContacts = await prisma.contact.findMany({
        where: { workspaceId, phone: { in: normalizedNumbers } },
        select: { id: true, phone: true },
      });
      const contactIdsByPhone = new Map(knownContacts.map((contact) => [contact.phone, contact.id]));

      const campaign = await campaignService.createCampaign({
        name: data.name,
        totalContacts: data.recipients.length,
      });

      try {
        const contactsForQueue = data.recipients.map((recipient, index) => ({
          id: contactIdsByPhone.get(normalizePhone(recipient.number)) || `temp-recip-${index}-${Date.now()}`,
          name: recipient.name,
          number: normalizePhone(recipient.number),
          groupIds: [],
        }));

        await queueService.startCampaign(
          campaign.id,
          campaign.name,
          contactsForQueue,
          campaignMessage,
          campaignMedia,
          data.templateId || undefined
        );
        campaignQueued = true;
      } catch (error) {
        await campaignService.completeCampaign(campaign.id, { sentCount: 0, failedCount: 0 });
        throw new Error(`Falha ao registrar campanha na fila: ${error instanceof Error ? error.message : String(error)}`);
      }

      await reservation.complete();
      return campaign;
    } catch (error) {
      if (!campaignQueued) {
        await reservation.abort();
      }
      throw error;
    }
  },

  async stopCampaign(workspaceId: string) {
    await getQueueService(workspaceId).stopCampaign();
    return true;
  },

  async getStatus(workspaceId: string, logOffset: number = 0, includeFailures = false) {
    return getQueueService(workspaceId).getStatus(logOffset, includeFailures);
  },

  async getHistory(workspaceId: string, limit: number = 50) {
    return getCampaignService(workspaceId).getCampaignHistory(limit);
  },

  async getHistoryItem(id: string, workspaceId: string) {
    return getCampaignService(workspaceId).getCampaignHistoryItem(id);
  },

  async completeCampaign(id: string, data: CompleteCampaignCommand, workspaceId: string) {
    const campaignService = getCampaignService(workspaceId);
    const reportService = getReportService(workspaceId);
    const campaign = await campaignService.completeCampaign(id, {
      sentCount: data.sentCount,
      failedCount: data.failedCount,
    });

    const config = await reportService.getConfig();
    let reportSent = false;

    if (config?.sendImmediate) {
      const reportMessage = reportService.formatImmediateReport(campaign);
      const chartUrl = reportService.getImmediateChartUrl(campaign);
      const whatsapp = getWhatsAppInstance();
      const result = await reportService.sendReportToAllRecipients(whatsapp, reportMessage, chartUrl);
      if (result.success || result.sentTo.length > 0) {
        await campaignService.markImmediateReportSent(id);
        reportSent = true;
      }
    }

    return { campaign, reportSent };
  },
};
export default CampaignCommandService;
