import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiHandler } from '@/lib/api-handler';
import { updateSettingsSchema } from '@/server/validators/settings';
import { ValidationError } from '@/lib/api-errors';
import { DEFAULT_CONFIG_ID } from '@/constants/domain';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings
 * Retorna as configurações gerais da aplicação.
 */
export const GET = apiHandler(async () => {
  const settings = await prisma.settings.findUnique({
    where: { id: DEFAULT_CONFIG_ID }
  });
  return NextResponse.json(settings || { defaultLink: '', defaultCTA: '' });
}, { routeName: '/api/settings (GET)', requireAuth: true });

/**
 * PUT /api/settings
 * Atualiza ou cria as configurações gerais da aplicação.
 */
export const PUT = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));

  const validation = updateSettingsSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Configurações inválidas.', validation.error.flatten().fieldErrors);
  }

  const { defaultLink, defaultCTA } = validation.data;

  const settings = await prisma.settings.upsert({
    where: { id: DEFAULT_CONFIG_ID },
    update: { defaultLink, defaultCTA },
    create: { id: DEFAULT_CONFIG_ID, defaultLink, defaultCTA }
  });

  return NextResponse.json(settings);
}, { routeName: '/api/settings (PUT)', requireAuth: true });

