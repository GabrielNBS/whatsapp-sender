import { z } from 'zod';

export const reportConfigSchema = z.object({
  sendImmediate: z.boolean().optional(),
  sendEngagement: z.boolean().optional(),
  engagementDelayMins: z.coerce.number().int().min(1).max(1440).optional().nullable(),
  engagementTimeFixed: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM esperado)').optional().nullable(),
}).strict(); // strict impede propriedades extras não listadas (bloqueia mass assignment)

export const createRecipientSchema = z.object({
  name: z.string().min(1, 'O nome do destinatário é obrigatório').max(100).trim(),
  phone: z.string().min(10, 'O número de telefone deve conter no mínimo 10 dígitos').max(15).trim(),
});

export const updateRecipientSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  phone: z.string().min(10).max(15).trim().optional(),
  isActive: z.boolean().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: 'Informe ao menos um campo para atualização.',
});

export type ReportConfigInput = z.infer<typeof reportConfigSchema>;
export type CreateRecipientInput = z.infer<typeof createRecipientSchema>;
export type UpdateRecipientInput = z.infer<typeof updateRecipientSchema>;
