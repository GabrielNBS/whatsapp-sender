import { z } from 'zod';

export const createSnippetSchema = z.object({
  trigger: z.string()
    .min(1, 'O atalho (trigger) é obrigatório')
    .max(30, 'O atalho deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_\-\/]+$/, 'O atalho deve conter apenas letras, números, hifens, underlines e barra')
    .trim(),
  content: z.string()
    .min(1, 'O conteúdo do snippet é obrigatório')
    .max(1024, 'O conteúdo do snippet deve ter no máximo 1024 caracteres')
    .trim(),
});

export const updateSnippetSchema = createSnippetSchema.extend({
  id: z.string().uuid().optional(),
});

export type CreateSnippetInput = z.infer<typeof createSnippetSchema>;
export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>;
