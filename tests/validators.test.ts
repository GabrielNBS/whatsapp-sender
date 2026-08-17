import { describe, expect, it } from 'vitest';
import { startCampaignSchema } from '@/server/validators/campaigns';
import { sendMessageSchema } from '@/server/validators/messages';
import { updateRecipientSchema } from '@/server/validators/reports';
import { createScheduleSchema } from '@/server/validators/schedule';
import { MAX_RECIPIENTS_LIMIT } from '@/constants/domain';

describe('API payload contracts', () => {
  it('rejects an empty direct message', () => {
    expect(sendMessageSchema.safeParse({ phone: '5511999999999' }).success).toBe(false);
  });

  it('preserves a boolean false when disabling a report recipient', () => {
    const result = updateRecipientSchema.parse({ isActive: false });
    expect(result.isActive).toBe(false);
  });

  it('rejects campaigns above the recipient limit', () => {
    const recipients = Array.from({ length: MAX_RECIPIENTS_LIMIT + 1 }, (_, index) => ({
      name: `Contato ${index}`,
      number: `55119${String(index).padStart(8, '0')}`,
    }));
    expect(startCampaignSchema.safeParse({
      name: 'Campanha',
      message: 'Mensagem',
      idempotencyKey: 'request-1',
      recipients,
    }).success).toBe(false);
  });

  it('rejects schedules without a template, message or media', () => {
    expect(createScheduleSchema.safeParse({
      recipients: [{ name: 'Contato', number: '5511999999999' }],
      scheduledFor: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
    }).success).toBe(false);
  });

  it('rejects schedules that start in less than two minutes', () => {
    const result = createScheduleSchema.safeParse({
      recipients: [{ name: 'Contato', number: '5511999999999' }],
      message: 'Mensagem agendada',
      scheduledFor: new Date(Date.now() + 60 * 1000).toISOString(),
    });

    expect(result.success).toBe(false);
  });

  it('accepts a valid future schedule', () => {
    const result = createScheduleSchema.safeParse({
      recipients: [{ name: 'Contato', number: '5511999999999' }],
      message: 'Mensagem agendada',
      scheduledFor: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
    });

    expect(result.success).toBe(true);
  });
});
