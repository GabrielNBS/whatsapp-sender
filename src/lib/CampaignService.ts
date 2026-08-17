import { PrismaClient, Campaign } from "@prisma/client";
import { logger } from "./logger";

export interface ICampaignService {
  createCampaign(data: CreateCampaignData): Promise<Campaign>;
  completeCampaign(campaignId: string, metrics: CampaignCompletionMetrics): Promise<Campaign>;
  completeCampaignIfOpen(campaignId: string, metrics: CampaignCompletionMetrics): Promise<Campaign | null>;
  updateCampaignMetrics(campaignId: string, metrics: Partial<CampaignMetrics>): Promise<Campaign>;
  getCampaign(campaignId: string): Promise<Campaign | null>;
  getRecentCampaigns(limit?: number): Promise<Campaign[]>;
  getCampaignHistory(limit?: number): Promise<CampaignHistorySummary[]>;
  getCampaignHistoryItem(campaignId: string): Promise<CampaignHistoryItem | null>;
  getPendingEngagementReports(): Promise<Campaign[]>;
  markImmediateReportSentIfPending(campaignId: string): Promise<boolean>;
}

export interface CreateCampaignData {
  name: string;
  templateName?: string;
  totalContacts: number;
}

export interface CampaignCompletionMetrics {
  sentCount: number;
  failedCount: number;
}

export interface CampaignMetrics {
  sentCount: number;
  failedCount: number;
  readCount: number;
  responseCount: number;
}

export interface FailedMessageDetail {
  contactName: string;
  contactPhone: string;
  templateId: string;
}

export interface CampaignHistoryItem extends Campaign {
  failedDetails: FailedMessageDetail[];
  templateId?: string;
  templateTitle?: string;
  templateContent?: string;
  templateMedia?: string | null;
}

export type CampaignHistorySummary = Campaign;

// ============================================
// IMPLEMENTATION
// ============================================

export class CampaignService implements ICampaignService {
  constructor(private prisma: PrismaClient, private workspaceId: string) {}

  /**
   * Create a new campaign when sending starts
   */
  async createCampaign(data: CreateCampaignData): Promise<Campaign> {
    logger.info(`[Campaign] Criando campanha '${data.name}' (${data.totalContacts} contatos)`);
    
    return this.prisma.campaign.create({
      data: {
        workspaceId: this.workspaceId,
        name: data.name,
        templateName: data.templateName,
        totalContacts: data.totalContacts,
        startedAt: new Date(),
      },
    });
  }

  /**
   * Mark campaign as complete and record final metrics
   */
  async completeCampaign(
    campaignId: string,
    metrics: CampaignCompletionMetrics
  ): Promise<Campaign> {
    logger.info(
      { campaignId, ...metrics },
      `[Campaign] Campanha concluida: ${metrics.sentCount} enviados, ${metrics.failedCount} falhas`
    );
    
    return this.prisma.campaign.update({
      where: { id: campaignId, workspaceId: this.workspaceId },
      data: {
        completedAt: new Date(),
        sentCount: metrics.sentCount,
        failedCount: metrics.failedCount,
      },
    });
  }

  async completeCampaignIfOpen(
    campaignId: string,
    metrics: CampaignCompletionMetrics
  ): Promise<Campaign | null> {
    const result = await this.prisma.campaign.updateMany({
      where: {
        id: campaignId,
        workspaceId: this.workspaceId,
        completedAt: null,
      },
      data: {
        completedAt: new Date(),
        sentCount: metrics.sentCount,
        failedCount: metrics.failedCount,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.prisma.campaign.findUnique({
      where: { id: campaignId, workspaceId: this.workspaceId },
    });
  }

  /**
   * Update campaign metrics (used for engagement tracking)
   */
  async updateCampaignMetrics(
    campaignId: string,
    metrics: Partial<CampaignMetrics>
  ): Promise<Campaign> {
    return this.prisma.campaign.update({
      where: { id: campaignId, workspaceId: this.workspaceId },
      data: metrics,
    });
  }

  /**
   * Get a specific campaign by ID
   */
  async getCampaign(campaignId: string): Promise<Campaign | null> {
    return this.prisma.campaign.findUnique({
      where: { id: campaignId, workspaceId: this.workspaceId },
    });
  }

  /**
   * Get recent campaigns for dashboard display
   */
  async getRecentCampaigns(limit: number = 10): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      where: { workspaceId: this.workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /** Retorna apenas o necessário para a lista do histórico. */
  async getCampaignHistory(limit: number = 50): Promise<CampaignHistorySummary[]> {
    return this.prisma.campaign.findMany({
      where: { workspaceId: this.workspaceId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  /** Carrega template e falhas somente quando a campanha é aberta. */
  async getCampaignHistoryItem(campaignId: string): Promise<CampaignHistoryItem | null> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId: this.workspaceId },
    });
    if (!campaign) return null;

    const [failedMessages, templateSample] = await Promise.all([
      this.prisma.scheduledMessage.findMany({
        where: { batchId: campaignId, workspaceId: this.workspaceId, status: 'FAILED' },
        select: { contactName: true, contactPhone: true, templateId: true },
      }),
      this.prisma.scheduledMessage.findFirst({
        where: { batchId: campaignId, workspaceId: this.workspaceId },
        orderBy: { createdAt: 'asc' },
        select: {
          template: { select: { id: true, title: true, content: true, media: true } },
        },
      }),
    ]);

    return {
      ...campaign,
      failedDetails: failedMessages.map((message) => ({
        contactName: message.contactName,
        contactPhone: message.contactPhone,
        templateId: message.templateId,
      })),
      templateId: templateSample?.template?.id,
      templateTitle: templateSample?.template?.title,
      templateContent: templateSample?.template?.content,
      templateMedia: templateSample?.template?.media ?? null,
    };
  }

  /**
   * Get campaigns that need engagement reports sent
   */
  async getPendingEngagementReports(): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      where: {
        completedAt: { not: null },
        workspaceId: this.workspaceId,
        engagementReportSentAt: null,
      },
      orderBy: { completedAt: 'asc' },
    });
  }

  /**
   * Mark immediate report as sent
   */
  async markImmediateReportSent(campaignId: string): Promise<Campaign> {
    return this.prisma.campaign.update({
      where: { id: campaignId, workspaceId: this.workspaceId },
      data: { immediateReportSentAt: new Date() },
    });
  }

  async markImmediateReportSentIfPending(campaignId: string): Promise<boolean> {
    const result = await this.prisma.campaign.updateMany({
      where: {
        id: campaignId,
        workspaceId: this.workspaceId,
        immediateReportSentAt: null,
      },
      data: { immediateReportSentAt: new Date() },
    });

    return result.count > 0;
  }

  /**
   * Mark engagement report as sent
   */
  async markEngagementReportSent(campaignId: string): Promise<Campaign> {
    return this.prisma.campaign.update({
      where: { id: campaignId, workspaceId: this.workspaceId },
      data: { engagementReportSentAt: new Date() },
    });
  }
}

// ============================================
// SINGLETON FACTORY
// ============================================

import { prisma } from './db';

const campaignServiceInstances = new Map<string, CampaignService>();

export function getCampaignService(workspaceId: string): CampaignService {
  let instance = campaignServiceInstances.get(workspaceId);
  if (!instance) {
    instance = new CampaignService(prisma, workspaceId);
    campaignServiceInstances.set(workspaceId, instance);
  }
  return instance;
}

export default getCampaignService;
