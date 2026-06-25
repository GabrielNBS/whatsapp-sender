import { z } from 'zod';
import { templateMediaSchema } from './templates';
import { MAX_RECIPIENTS_LIMIT } from '@/constants/domain';

export const scheduleRecipientInputSchema = z.object({
  name: z.string().min(1, 'Nome do destinatário é obrigatório').trim(),
  number: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
}).refine(data => data.number || data.phone, {
  message: 'O telefone (campo "number" ou "phone") é obrigatório',
  path: ['number']
});

export const createScheduleSchema = z.object({
  recipients: z.array(scheduleRecipientInputSchema)
    .min(1, 'Pelo menos um destinatário é obrigatório')
    .max(MAX_RECIPIENTS_LIMIT, `O limite máximo é de ${MAX_RECIPIENTS_LIMIT} destinatários por lote`),
  message: z.string().max(4096, 'Mensagem muito longa').optional().nullable(),
  media: templateMediaSchema.nullable().optional(),
  scheduledFor: z.string().datetime({ message: 'Data de agendamento em formato ISO inválido' }),
  batchName: z.string().max(100).optional().nullable(),
  templateId: z.string().optional().nullable(),
  timezone: z.string().optional().default('America/Sao_Paulo'),
});

export const rescheduleSchema = z.object({
  scheduledFor: z.string().datetime({ message: 'Data de agendamento em formato ISO inválido' }),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type RescheduleInput = z.infer<typeof rescheduleSchema>;
