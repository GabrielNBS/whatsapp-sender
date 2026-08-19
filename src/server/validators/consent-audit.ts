import { z } from 'zod';

export const consentAuditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
  source: z.enum(['MANUAL', 'WHATSAPP', 'SYSTEM', 'IMPORT']).optional(),
  status: z.enum(['UNKNOWN', 'OPTED_IN', 'OPTED_OUT']).optional(),
  search: z.string().trim().max(100).optional(),
});

export type ConsentAuditQueryInput = z.infer<typeof consentAuditQuerySchema>;
