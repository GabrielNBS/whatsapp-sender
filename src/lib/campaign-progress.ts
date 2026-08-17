export interface CampaignProgressInput {
  totalContacts: number;
  sentCount: number;
  failedCount: number;
}

export interface CampaignProgress extends CampaignProgressInput {
  processed: number;
  remaining: number;
  percent: number;
}

export const CAMPAIGN_SECONDS_PER_RECIPIENT = 20;

export function getCampaignProgress({
  totalContacts,
  sentCount,
  failedCount,
}: CampaignProgressInput): CampaignProgress {
  const processed = Math.min(totalContacts, Math.max(0, sentCount + failedCount));
  const remaining = Math.max(0, totalContacts - processed);
  const percent = totalContacts > 0 ? Math.round((processed / totalContacts) * 100) : 0;

  return { totalContacts, sentCount, failedCount, processed, remaining, percent };
}

export function estimateCampaignDurationMinutes(totalContacts: number): number {
  return Math.ceil((Math.max(0, totalContacts) * CAMPAIGN_SECONDS_PER_RECIPIENT) / 60);
}

