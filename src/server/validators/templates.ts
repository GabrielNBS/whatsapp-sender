import { z } from 'zod';
import { MAX_CATEGORY_LENGTH } from '@/constants/templates';
import { MAX_MEDIA_BASE64_LENGTH } from '@/constants/domain';

export const templateMediaSchema = z.object({
  mimetype: z.string().min(1, 'O tipo MIME da mídia é obrigatório'),
  data: z.string().min(1, 'Os dados em base64 da mídia são obrigatórios').max(MAX_MEDIA_BASE64_LENGTH, 'A mídia excede o limite de 20 MB'),
  filename: z.string().max(255).optional(),
}).strict();

export const createTemplateSchema = z.object({
  title: z.string()
    .min(1, 'O título do modelo é obrigatório')
    .max(50, 'O título deve ter no máximo 50 caracteres')
    .trim(),
  content: z.string()
    .min(1, 'O conteúdo da mensagem é obrigatório')
    .max(1024, 'O conteúdo da mensagem deve ter no máximo 1024 caracteres')
    .trim(),
  category: z.string()
    .max(MAX_CATEGORY_LENGTH, `A categoria deve ter no máximo ${MAX_CATEGORY_LENGTH} caracteres`)
    .trim()
    .nullable()
    .optional(),
  media: templateMediaSchema.nullable().optional(),
});

export const updateTemplateSchema = createTemplateSchema.extend({
  id: z.string().min(1, 'ID do modelo inválido').optional(),
});
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
