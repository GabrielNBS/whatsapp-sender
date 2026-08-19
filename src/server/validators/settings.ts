import { z } from 'zod';
import { OPT_OUT_FOOTER_OPTIONS, type OptOutFooterId } from '@/domain/opt-out-footer';

export const updateSettingsSchema = z.object({
  defaultLink: z.string()
    .trim()
    .url('O link padrão deve ser uma URL válida')
    .or(z.literal('')),
  defaultCTA: z.string()
    .max(100, 'O texto da chamada (CTA) deve ter no máximo 100 caracteres')
    .trim(),
  optOutFooterId: z.enum(
    OPT_OUT_FOOTER_OPTIONS.map((option) => option.id) as [OptOutFooterId, ...OptOutFooterId[]],
  ),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
