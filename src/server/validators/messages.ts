import { z } from 'zod';
import { templateMediaSchema } from './templates';

export const sendMessageSchema = z.object({
  phone: z.string().min(10, 'Número de telefone inválido (mínimo 10 dígitos)').max(15, 'Número de telefone muito longo').trim(),
  message: z.string().max(4096, 'Mensagem muito longa (máximo 4096 caracteres)').optional().nullable(),
  media: templateMediaSchema.nullable().optional(),
  idempotencyKey: z.string().trim().optional().nullable(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
