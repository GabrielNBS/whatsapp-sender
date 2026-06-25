import { NextRequest, NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp';
import { apiHandler } from '@/lib/api-handler';
import { normalizePhone } from '@/services/contacts/normalizePhone';
import { ValidationError } from '@/lib/api-errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const avatarQuerySchema = z.object({
  phone: z.string().min(10, 'Número de telefone inválido (mínimo 10 dígitos)').max(15, 'Número de telefone muito longo').trim(),
});

/**
 * GET /api/contacts/avatar
 * Retorna a URL da foto de perfil do contato a partir do WhatsApp.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const phoneParam = searchParams.get('phone');

  const validation = avatarQuerySchema.safeParse({ phone: phoneParam });
  if (!validation.success) {
    throw new ValidationError('Parâmetro de telefone inválido.', validation.error.flatten().fieldErrors);
  }

  const normalized = normalizePhone(validation.data.phone);

  if (normalized.length < 10 || normalized.length > 15) {
    throw new ValidationError('O número de telefone deve conter entre 10 e 15 dígitos numéricos.');
  }

  const avatarUrl = await whatsappService.getProfilePicUrl(normalized);

  return NextResponse.json({ url: avatarUrl });
}, { routeName: '/api/contacts/avatar (GET)', requireAuth: true });

