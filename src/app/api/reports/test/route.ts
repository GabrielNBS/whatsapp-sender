import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { getCurrentWorkspaceId } from '@/server/workspace';
import { getReportTestService } from '@/server/services/service-factory';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/test
 * Envia um relatório de teste para todos os gestores ativos.
 * Restrito apenas para ambiente de desenvolvimento (API-009).
 */
export const POST = apiHandler(async () => {
  return NextResponse.json(await getReportTestService().send(getCurrentWorkspaceId()));
}, { routeName: '/api/reports/test (POST)', requireAuth: true });

/**
 * GET /api/reports/test
 * Lista os destinatários de teste para auditoria (apenas em desenvolvimento).
 */
export const GET = apiHandler(async () => {
  const recipients = await getReportTestService().listRecipients(getCurrentWorkspaceId());

  return NextResponse.json({
    count: recipients.length,
    recipients,
  });
}, { routeName: '/api/reports/test (GET)', requireAuth: true });
