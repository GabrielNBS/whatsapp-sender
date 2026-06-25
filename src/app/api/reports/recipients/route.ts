import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { ReportRecipientService } from '@/server/services/ReportRecipientService';
import { createRecipientSchema } from '@/server/validators/reports';
import { ValidationError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/recipients
 * Lista todos os gestores cadastrados para receber relatórios.
 */
export const GET = apiHandler(async () => {
  const recipients = await ReportRecipientService.listRecipients();
  return NextResponse.json(recipients);
}, { routeName: '/api/reports/recipients (GET)', requireAuth: false });

/**
 * POST /api/reports/recipients
 * Cadastra um novo gestor de relatórios de forma validada.
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));

  // Valida com schema Zod (API-002)
  const validation = createRecipientSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Dados de destinatário inválidos.', validation.error.flatten().fieldErrors);
  }

  const recipient = await ReportRecipientService.addRecipient(validation.data);
  return NextResponse.json(recipient, { status: 201 });
}, { routeName: '/api/reports/recipients (POST)', requireAuth: true });
