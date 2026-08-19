import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { updateSettingsSchema } from '@/server/validators/settings';
import { ValidationError } from '@/lib/api-errors';
import { getCurrentWorkspaceId } from '@/server/workspace';
import { settingsService } from '@/server/services/service-factory';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings
 * Retorna as configurações gerais da aplicação.
 */
export const GET = apiHandler(async () => {
  return NextResponse.json(await settingsService.get(getCurrentWorkspaceId()));
}, { routeName: '/api/settings (GET)', requireAuth: true });

/**
 * PUT /api/settings
 * Atualiza ou cria as configurações gerais da aplicação.
 */
export const PUT = apiHandler(async (req: NextRequest) => {
  const workspaceId = getCurrentWorkspaceId();
  const body = await req.json().catch(() => ({}));

  const validation = updateSettingsSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Configurações inválidas.', validation.error.flatten().fieldErrors);
  }

  return NextResponse.json(await settingsService.update(validation.data, workspaceId));
}, { routeName: '/api/settings (PUT)', requireAuth: true });

