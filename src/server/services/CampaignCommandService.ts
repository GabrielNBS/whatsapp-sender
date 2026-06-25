import { getCampaignService } from "@/lib/CampaignService";
import { getQueueService } from "@/lib/QueueService";
import { getReportService } from "@/lib/ReportService";
import { getWhatsAppInstance } from "@/lib/whatsapp";
import { StartCampaignInput, CampaignCompleteInput } from "../validators/campaigns";
import { ConflictError } from "@/lib/api-errors";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/services/contacts/normalizePhone";
import { beginIdempotentOperation } from "@/lib/idempotency";

export const CampaignCommandService = {
  async startCampaign(data: StartCampaignInput) {
    const queueService = getQueueService();
    const campaignService = getCampaignService();
    const reservation = beginIdempotentOperation(data.idempotencyKey);

    try {
      const activeStatus = await queueService.getStatus(0);
      if (activeStatus.isSending) {
        throw new ConflictError("Ja existe uma campanha ativa em andamento.");
      }

      let campaignMessage = data.message || "";
      let campaignMedia: any = data.media || undefined;

      if (data.templateId) {
        const template = await prisma.template.findUnique({
          where: { id: data.templateId },
        });
        if (template) {
          campaignMessage = template.content;
          campaignMedia = template.media ? JSON.parse(template.media as string) : undefined;
        }
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
      } catch (error) {
        await campaignService.completeCampaign(campaign.id, { sentCount: 0, failedCount: 0 });
        throw new Error(`Falha ao registrar campanha na fila: ${error instanceof Error ? error.message : String(error)}`);
      }

      reservation.complete();
      return campaign;
    } catch (error) {
      reservation.abort();
      throw error;
    }
  },

  async stopCampaign() {
    await getQueueService().stopCampaign();
    return true;
  },

  async getStatus(logOffset: number = 0) {
    return getQueueService().getStatus(logOffset);
  },

  async getHistory(limit: number = 50) {
    return getCampaignService().getCampaignHistory(limit);
  },

  async completeCampaign(id: string, data: CampaignCompleteInput) {
    const campaignService = getCampaignService();
    const reportService = getReportService();
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
