import { getCampaignService } from "@/lib/CampaignService";
import { getQueueService } from "@/lib/QueueService";
import { getReportService } from "@/lib/ReportService";
import { getWhatsAppInstance } from "@/lib/whatsapp";
import { StartCampaignInput, CampaignCompleteInput } from "../validators/campaigns";
import { ConflictError, NotFoundError } from "@/lib/api-errors";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/services/contacts/normalizePhone";
import { beginIdempotentOperation } from "@/lib/idempotency";
import { getCurrentWorkspaceId } from "@/server/workspace";

type CampaignMedia = NonNullable<StartCampaignInput["media"]>;

export const CampaignCommandService = {
  async startCampaign(data: StartCampaignInput) {
    const workspaceId = getCurrentWorkspaceId();
    const queueService = getQueueService(workspaceId);
    const campaignService = getCampaignService(workspaceId);
    const reservation = await beginIdempotentOperation(workspaceId, data.idempotencyKey);
    let campaignQueued = false;

    try {
      const activeStatus = await queueService.getStatus(0);
      if (activeStatus.isSending) {
        throw new ConflictError("Ja existe uma campanha ativa em andamento.");
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

      const campaign = await campaignService.createCampaign({
        name: data.name,
        totalContacts: data.recipients.length,
      });

      try {
        const contactsForQueue = data.recipients.map((recipient, index) => ({
          id: `temp-recip-${index}-${Date.now()}`,
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

  async stopCampaign() {
    await getQueueService(getCurrentWorkspaceId()).stopCampaign();
    return true;
  },

  async getStatus(logOffset: number = 0) {
    return getQueueService(getCurrentWorkspaceId()).getStatus(logOffset);
  },

  async getHistory(limit: number = 50) {
    return getCampaignService(getCurrentWorkspaceId()).getCampaignHistory(limit);
  },

  async completeCampaign(id: string, data: CampaignCompleteInput) {
    const workspaceId = getCurrentWorkspaceId();
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
