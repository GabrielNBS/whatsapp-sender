import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { apiHandler } from '@/lib/api-handler';
import { createSnippetSchema } from '@/server/validators/snippets';
import { ValidationError, NotFoundError } from '@/lib/api-errors';
import { z } from 'zod';
import { getCurrentWorkspaceId } from '@/server/workspace';

export const dynamic = 'force-dynamic';

/**
 * GET /api/snippets
 * Lista todos os snippets cadastrados.
 */
export const GET = apiHandler(async () => {
  const workspaceId = getCurrentWorkspaceId();
  const snippets = await prisma.snippet.findMany({
    where: { workspaceId },
    orderBy: { trigger: 'asc' }
  });
  return NextResponse.json(snippets);
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

  let { trigger } = validation.data;
  const { content } = validation.data;
  if (!trigger.startsWith('/')) {
    trigger = '/' + trigger;
  }

  const snippet = await prisma.snippet.create({
    data: { workspaceId, trigger, content }
  });

  return NextResponse.json(snippet, { status: 201 });
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

  try {
    await prisma.snippet.delete({
      where: { id: validation.data, workspaceId }
    });
  } catch (error: unknown) {
    // P2025 é o código do Prisma para "Record not found"
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundError('Snippet não encontrado.');
    }
    throw error;
  }

  return NextResponse.json({ success: true });
}, { routeName: '/api/snippets (DELETE)', requireAuth: true });

