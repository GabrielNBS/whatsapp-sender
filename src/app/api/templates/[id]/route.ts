import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { TemplateService } from '@/server/services/TemplateService';
import { updateTemplateSchema } from '@/server/validators/templates';
import { ValidationError, NotFoundError } from '@/lib/api-errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/templates/[id]
 * Atualiza um modelo de mensagem.
 */
export const PUT = apiHandler(async (req: NextRequest, { params }: RouteParams) => {
  const { id } = await params;
  if (!id) {
    throw new ValidationError('ID do modelo é obrigatório na rota.');
  }

  const body = await req.json().catch(() => ({}));
  
  // Valida dados de entrada usando o schema Zod (API-002)
  const validation = updateTemplateSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Dados de modelo inválidos.', validation.error.flatten().fieldErrors);
  }

  const template = await TemplateService.updateTemplate(id, validation.data);
  return NextResponse.json(template);
}, { routeName: '/api/templates/[id] (PUT)', requireAuth: true });

/**
 * DELETE /api/templates/[id]
 * Exclui um modelo de mensagem.
 */
export const DELETE = apiHandler(async (req: NextRequest, { params }: RouteParams) => {
  const { id } = await params;
  if (!id) {
    throw new ValidationError('ID do modelo é obrigatório na rota.');
  }

  // Verifica existência antes de deletar para retornar 404 (API-007)
  const existing = await TemplateService.getTemplateById(id);
  if (!existing) {
    throw new NotFoundError('O modelo solicitado não foi encontrado.');
  }

  await TemplateService.deleteTemplate(id);
  return NextResponse.json({ success: true });
}, { routeName: '/api/templates/[id] (DELETE)', requireAuth: true });
