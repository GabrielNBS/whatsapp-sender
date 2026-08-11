import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { ReportRecipientService } from '@/server/services/ReportRecipientService';
import { updateRecipientSchema } from '@/server/validators/reports';
import { ValidationError } from '@/lib/api-errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/reports/recipients/[id]
 * Atualiza dados de um gestor de relatórios (nome, telefone ou ativo) com whitelist de campos.
 */
export const PATCH = apiHandler(async (req: NextRequest, { params }: RouteParams) => {
  const { id } = await params;
  if (!id) {
    throw new ValidationError('ID do destinatário é obrigatório na rota.');
  }

  const body = await req.json().catch(() => ({}));

  // Valida com Zod (API-002 / API-009)
  const validation = updateRecipientSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Dados de atualização inválidos.', validation.error.flatten().fieldErrors);
  }

  const recipient = await ReportRecipientService.updateRecipient(id, validation.data);

  return NextResponse.json(recipient);
}, { routeName: '/api/reports/recipients/[id] (PATCH)', requireAuth: true });

/**
 * DELETE /api/reports/recipients/[id]
 * Exclui um gestor de relatórios do sistema.
 */
export const DELETE = apiHandler(async (req: NextRequest, { params }: RouteParams) => {
  const { id } = await params;
  if (!id) {
    throw new ValidationError('ID do destinatário é obrigatório na rota.');
  }

  await ReportRecipientService.deleteRecipient(id);
  return NextResponse.json({ success: true });
}, { routeName: '/api/reports/recipients/[id] (DELETE)', requireAuth: true });
