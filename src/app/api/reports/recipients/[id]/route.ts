import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { ReportRecipientService } from '@/server/services/ReportRecipientService';
import { updateRecipientSchema } from '@/server/validators/reports';
import { ValidationError } from '@/lib/api-errors';
import { prisma } from '@/lib/db';
import { normalizePhone } from '@/services/contacts/normalizePhone';

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
  const validation = updateRecipientSchema.partial().safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Dados de atualização inválidos.', validation.error.flatten().fieldErrors);
  }

  const data = validation.data;
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.phone !== undefined) updateData.phone = normalizePhone(data.phone);
  
  // Suporta também toggle active
  if (body.isActive !== undefined) {
    updateData.isActive = Boolean(body.isActive);
  }

  const recipient = await prisma.reportRecipient.update({
    where: { id },
    data: updateData,
  });

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
