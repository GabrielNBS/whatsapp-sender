import { describe, expect, it } from 'vitest';
import {
  estimateCampaignDurationMinutes,
  getCampaignProgress,
} from '@/lib/campaign-progress';

describe('getCampaignProgress', () => {
  it('derives a stable progress view from sent and failed messages', () => {
    expect(getCampaignProgress({ totalContacts: 10, sentCount: 6, failedCount: 2 })).toEqual({
      totalContacts: 10,
      sentCount: 6,
      failedCount: 2,
      processed: 8,
      remaining: 2,
      percent: 80,
    });
  });

  it('clamps inconsistent counters to the campaign total', () => {
    expect(getCampaignProgress({ totalContacts: 3, sentCount: 3, failedCount: 2 })).toMatchObject({
      processed: 3,
      remaining: 0,
      percent: 100,
    });
  });
});

describe('estimateCampaignDurationMinutes', () => {
  it('uses the shared per-recipient estimate and rounds up', () => {
    expect(estimateCampaignDurationMinutes(4)).toBe(2);
    expect(estimateCampaignDurationMinutes(-1)).toBe(0);
  });
});
