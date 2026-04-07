/**
 * CampaignService
 * 
 * Responsible for tracking campaigns (message broadcasts) and their metrics.
 * Follows SRP: handles only campaign lifecycle and metrics.
 */

import { PrismaClient, Campaign, Prisma } from '@prisma/client';

// ============================================
// INTERFACES (DIP)
// ============================================

export interface ICampaignService {
  createCampaign(data: CreateCampaignData): Promise<Campaign>;
  completeCampaign(campaignId: string, metrics: CampaignCompletionMetrics): Promise<Campaign>;
  updateCampaignMetrics(campaignId: string, metrics: Partial<CampaignMetrics>): Promise<Campaign>;
  getCampaign(campaignId: string): Promise<Campaign | null>;
  getRecentCampaigns(limit?: number): Promise<Campaign[]>;
  getCampaignHistory(limit?: number): Promise<CampaignHistoryItem[]>;
  getPendingEngagementReports(): Promise<Campaign[]>;
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

type ScheduledMessageWithTemplate = Prisma.ScheduledMessageGetPayload<{
  include: { template: true };
}>;

// ============================================
// IMPLEMENTATION
// ============================================

export class CampaignService implements ICampaignService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new campaign when sending starts
   */
  async createCampaign(data: CreateCampaignData): Promise<Campaign> {
    console.log('[CampaignService] Creating campaign:', data.name);
    
    return this.prisma.campaign.create({
      data: {
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
    console.log('[CampaignService] Completing campaign:', campaignId, metrics);
    
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        completedAt: new Date(),
        sentCount: metrics.sentCount,
        failedCount: metrics.failedCount,
      },
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
      where: { id: campaignId },
      data: metrics,
    });
  }

  /**
   * Get a specific campaign by ID
   */
  async getCampaign(campaignId: string): Promise<Campaign | null> {
    return this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
  }

  /**
   * Get recent campaigns for dashboard display
   */
  async getRecentCampaigns(limit: number = 10): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get full campaign history with failure details
   */
  async getCampaignHistory(limit: number = 50): Promise<CampaignHistoryItem[]> {
    const campaigns = await this.prisma.campaign.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    if (campaigns.length === 0) {
      return [];
    }

    const campaignIds = campaigns.map((campaign) => campaign.id);
    const scheduledMessages = await this.prisma.scheduledMessage.findMany({
      where: {
        batchId: { in: campaignIds },
      },
      include: { template: true },
      orderBy: { createdAt: 'asc' },
    });

    const messagesByBatch = scheduledMessages.reduce<Map<string, ScheduledMessageWithTemplate[]>>((map, message) => {
      if (!message.batchId) {
        return map;
      }

      const currentMessages = map.get(message.batchId) ?? [];
      currentMessages.push(message);
      map.set(message.batchId, currentMessages);
      return map;
    }, new Map());

    const history = campaigns.map((camp) => {
      const batchMessages = messagesByBatch.get(camp.id) ?? [];
      const failedMessages = batchMessages
        .filter((message) => message.status === 'FAILED')
        .map((message) => ({
          contactName: message.contactName,
          contactPhone: message.contactPhone,
          templateId: message.templateId,
        }));
      const templateData = batchMessages[0]?.template;

      return {
        ...camp,
        failedDetails: failedMessages,
        templateId: templateData?.id,
        templateTitle: templateData?.title,
        templateContent: templateData?.content,
        templateMedia: templateData?.media ?? null,
      };
    });
    
    return history;
  }

  /**
   * Get campaigns that need engagement reports sent
   */
  async getPendingEngagementReports(): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      where: {
        completedAt: { not: null },
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
      where: { id: campaignId },
      data: { immediateReportSentAt: new Date() },
    });
  }

  /**
   * Mark engagement report as sent
   */
  async markEngagementReportSent(campaignId: string): Promise<Campaign> {
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { engagementReportSentAt: new Date() },
    });
  }
}

// ============================================
// SINGLETON FACTORY
// ============================================

import { prisma } from './db';

let campaignServiceInstance: CampaignService | null = null;

export function getCampaignService(): CampaignService {
  if (!campaignServiceInstance) {
    campaignServiceInstance = new CampaignService(prisma);
  }
  return campaignServiceInstance;
}

export default getCampaignService;
