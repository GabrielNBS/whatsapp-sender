import type { ContactConsentStatus, TemplateMediaPayload } from '@/lib/types';

export interface CampaignRecipient {
  name: string;
  number: string;
}

export interface StartCampaignCommand {
  name: string;
  message?: string | null;
  media?: TemplateMediaPayload | null;
  templateId?: string | null;
  recipients: CampaignRecipient[];
  idempotencyKey: string;
}

export interface CompleteCampaignCommand {
  sentCount: number;
  failedCount: number;
}

export interface ContactCommand {
  id: string;
  name: string;
  number: string;
  groupIds: string[];
  consentStatus?: ContactConsentStatus;
}

export interface ContactGroupCommand {
  id: string;
  name: string;
  description?: string | null;
}

export interface UpdateContactCommand {
  name?: string;
  number?: string;
  groupIds?: string[];
  consentStatus?: ContactConsentStatus;
}

export interface SendMessageCommand {
  phone: string;
  message?: string | null;
  media?: TemplateMediaPayload | null;
  idempotencyKey?: string | null;
}

export interface ScheduleRecipient {
  name: string;
  number?: string | null;
  phone?: string | null;
}

export interface CreateScheduleCommand {
  recipients: ScheduleRecipient[];
  message?: string | null;
  media?: TemplateMediaPayload | null;
  scheduledFor: string;
  batchName?: string | null;
  templateId?: string | null;
  timezone?: string;
}

export interface CreateTemplateCommand {
  title: string;
  content: string;
  category?: string | null;
  media?: TemplateMediaPayload | null;
}

export interface UpdateTemplateCommand extends CreateTemplateCommand {
  id?: string;
}

export interface ReportConfigCommand {
  sendImmediate?: boolean;
  sendEngagement?: boolean;
  engagementDelayMins?: number | null;
  engagementTimeFixed?: string | null;
}

export interface CreateReportRecipientCommand {
  name: string;
  phone: string;
}

export interface UpdateReportRecipientCommand {
  name?: string;
  phone?: string;
  isActive?: boolean;
}
