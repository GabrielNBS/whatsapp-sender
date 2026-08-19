import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { TemplateService } from '@/server/services/TemplateService';
import { createTemplateSchema } from '@/server/validators/templates';
import { getCurrentWorkspaceId } from '@/server/workspace';
import { ValidationError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/templates
 * Lista todos os modelos de mensagem do sistema (excluindo os do sistema/ocultos).
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const templates = req.nextUrl.searchParams.get('view') === 'summary'
    ? await TemplateService.listTemplateSummaries(getCurrentWorkspaceId())
    : await TemplateService.listTemplates(getCurrentWorkspaceId());
  return NextResponse.json(templates, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}, { routeName: '/api/templates (GET)', requireAuth: true });

/**
 * POST /api/templates
 * Cria um novo modelo de mensagem.
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));

  // Valida com schema Zod (API-002)
  const validation = createTemplateSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Dados de modelo inválidos.', validation.error.flatten().fieldErrors);
  }

  const template = await TemplateService.createTemplate(validation.data, getCurrentWorkspaceId());
  return NextResponse.json(template);
}, { routeName: '/api/templates (POST)', requireAuth: true });
