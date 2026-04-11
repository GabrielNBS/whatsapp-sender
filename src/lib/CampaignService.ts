/**
 * CampaignService
 * 
 * Responsible for tracking campaigns (message broadcasts) and their metrics.
 * Follows SRP: handles only campaign lifecycle and metrics.
 */

import { PrismaClient, Campaign } from '@prisma/client';

// ============================================
// INTERFACES (DIP)
// ============================================

export interface ICampaignService {
  createCampaign(data: CreateCampaignData): Promise<Campaign>;
  completeCampaign(campaignId: string, metrics: CampaignCompletionMetrics): Promise<Campaign>;
  completeCampaignIfOpen(campaignId: string, metrics: CampaignCompletionMetrics): Promise<Campaign | null>;
  updateCampaignMetrics(campaignId: string, metrics: Partial<CampaignMetrics>): Promise<Campaign>;
  getCampaign(campaignId: string): Promise<Campaign | null>;
  getRecentCampaigns(limit?: number): Promise<Campaign[]>;
  getCampaignHistory(limit?: number): Promise<CampaignHistoryItem[]>;
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

  async completeCampaignIfOpen(
    campaignId: string,
    metrics: CampaignCompletionMetrics
  ): Promise<Campaign | null> {
    const result = await this.prisma.campaign.updateMany({
      where: {
        id: campaignId,
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
      where: { id: campaignId },
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
    const [failedMessages, templateSamples] = await Promise.all([
      this.prisma.scheduledMessage.findMany({
        where: {
          batchId: { in: campaignIds },
          status: 'FAILED',
        },
        select: {
          batchId: true,
          contactName: true,
          contactPhone: true,
          templateId: true,
        },
      }),
      this.prisma.scheduledMessage.findMany({
        where: {
          batchId: { in: campaignIds },
        },
        orderBy: { createdAt: 'asc' },
        distinct: ['batchId'],
        select: {
          batchId: true,
          template: {
            select: {
              id: true,
              title: true,
              content: true,
              media: true,
            },
          },
        },
      }),
    ]);

    const failedByBatch = failedMessages.reduce<Map<string, FailedMessageDetail[]>>((map, message) => {
      if (!message.batchId) {
        return map;
      }

      const currentMessages = map.get(message.batchId) ?? [];
      currentMessages.push({
        contactName: message.contactName,
        contactPhone: message.contactPhone,
        templateId: message.templateId,
      });
      map.set(message.batchId, currentMessages);
      return map;
    }, new Map());

    const templateByBatch = templateSamples.reduce<Map<string, {
      id: string;
      title: string;
      content: string;
      media: string | null;
    }>>((map, message) => {
      if (!message.batchId || !message.template) {
        return map;
      }

      map.set(message.batchId, message.template);
      return map;
    }, new Map());

    const history = campaigns.map((camp) => {
      const failedDetails = failedByBatch.get(camp.id) ?? [];
      const templateData = templateByBatch.get(camp.id);

      return {
        ...camp,
        failedDetails,
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

  async markImmediateReportSentIfPending(campaignId: string): Promise<boolean> {
    const result = await this.prisma.campaign.updateMany({
      where: {
        id: campaignId,
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
