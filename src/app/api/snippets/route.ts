import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { createSnippetSchema } from '@/server/validators/snippets';
import { ValidationError } from '@/lib/api-errors';
import { z } from 'zod';
import { getCurrentWorkspaceId } from '@/server/workspace';
import { snippetService } from '@/server/services/service-factory';

export const dynamic = 'force-dynamic';

/**
 * GET /api/snippets
 * Lista todos os snippets cadastrados.
 */
export const GET = apiHandler(async () => {
  return NextResponse.json(await snippetService.list(getCurrentWorkspaceId()));
}, { routeName: '/api/snippets (GET)', requireAuth: true });

/**
 * POST /api/snippets
 * Cria um novo snippet.
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const workspaceId = getCurrentWorkspaceId();
  const body = await req.json().catch(() => ({}));

  const validation = createSnippetSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Dados do snippet inválidos.', validation.error.flatten().fieldErrors);
  }

  return NextResponse.json(await snippetService.create(validation.data, workspaceId), { status: 201 });
}, { routeName: '/api/snippets (POST)', requireAuth: true });

/**
 * DELETE /api/snippets
 * Remove um snippet pelo ID.
 */
export const DELETE = apiHandler(async (req: NextRequest) => {
  const workspaceId = getCurrentWorkspaceId();
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');

  const validation = z.string().min(1, 'O ID do snippet é obrigatório').safeParse(id);
  if (!validation.success) {
    throw new ValidationError('ID do snippet inválido.', validation.error.flatten().fieldErrors);
  }

  await snippetService.delete(validation.data, workspaceId);

  return NextResponse.json({ success: true });
}, { routeName: '/api/snippets (DELETE)', requireAuth: true });

