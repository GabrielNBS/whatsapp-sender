import { z } from 'zod';

export const updateSettingsSchema = z.object({
  defaultLink: z.string()
    .trim()
    .url('O link padrão deve ser uma URL válida')
    .or(z.literal('')),
  defaultCTA: z.string()
    .max(100, 'O texto da chamada (CTA) deve ter no máximo 100 caracteres')
    .trim(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
