import { z } from 'zod';
import { API_MAX_PAGE_SIZE } from '@/constants/api';

export const campaignRecipientSchema = z.object({
  name: z.string().min(1, 'Nome do destinatário é obrigatório').trim(),
  number: z.string().min(1, 'Número do destinatário é obrigatório').trim(),
});

export const startCampaignSchema = z.object({
  name: z.string().min(1, 'O nome da campanha é obrigatório').max(100).trim(),
  message: z.string().max(4096).optional().nullable(),
  media: z.object({
    mimetype: z.string(),
    data: z.string(),
    filename: z.string().optional()
  }).optional().nullable(),
  templateId: z.string().optional().nullable(),
  recipients: z.array(campaignRecipientSchema).min(1, 'Pelo menos um destinatário é obrigatório'),
  idempotencyKey: z.string().min(1, 'Chave de idempotência é obrigatória').trim(),
});

export const campaignQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(API_MAX_PAGE_SIZE).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  logOffset: z.coerce.number().int().min(0).optional(),
});

export const campaignCompleteSchema = z.object({
  sentCount: z.coerce.number().int().min(0, 'Contagem de envios não pode ser negativa'),
  failedCount: z.coerce.number().int().min(0, 'Contagem de falhas não pode ser negativa'),
});

export type StartCampaignInput = z.infer<typeof startCampaignSchema>;
export type CampaignQueryInput = z.infer<typeof campaignQuerySchema>;
export type CampaignCompleteInput = z.infer<typeof campaignCompleteSchema>;
