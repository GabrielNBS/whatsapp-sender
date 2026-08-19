import { prisma } from '@/lib/db';
import { getWhatsAppInstance } from '@/lib/whatsapp';
import { AnalyticsQueryService } from './AnalyticsQueryService';
import { ReportTestService } from './ReportTestService';
import { SettingsService } from './SettingsService';
import { SnippetService } from './SnippetService';
import { WhatsAppApplicationService } from './WhatsAppApplicationService';

export const analyticsQueryService = new AnalyticsQueryService(prisma);
export const settingsService = new SettingsService(prisma);
export const snippetService = new SnippetService(prisma);

export function getWhatsAppApplicationService() {
  return new WhatsAppApplicationService(getWhatsAppInstance());
}

export function getReportTestService() {
  return new ReportTestService(prisma, getWhatsAppInstance());
}
