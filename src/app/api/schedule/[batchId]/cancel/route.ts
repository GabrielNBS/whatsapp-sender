import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { ScheduleService } from '@/server/services/ScheduleService';
import { ValidationError } from '@/lib/api-errors';

interface RouteParams {
  params: Promise<{ batchId: string }>;
}

/**
 * POST /api/schedule/[batchId]/cancel
 * Cancela todas as mensagens pendentes/pausadas de um lote específico (marcando-as como CANCELED).
 */
export const POST = apiHandler(async (req: NextRequest, { params }: RouteParams) => {
  const { batchId } = await params;

  if (!batchId) {
    throw new ValidationError('ID do lote (batchId) é obrigatório na rota.');
  }

  const result = await ScheduleService.cancelScheduleBatch(batchId);
  return NextResponse.json(result);
}, { routeName: '/api/schedule/[batchId]/cancel (POST)', requireAuth: true });
