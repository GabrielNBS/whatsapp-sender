import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { ScheduleService } from '@/server/services/ScheduleService';
import { rescheduleSchema } from '@/server/validators/schedule';
import { ValidationError } from '@/lib/api-errors';

interface RouteParams {
  params: Promise<{ batchId: string }>;
}

/**
 * POST /api/schedule/[batchId]/reschedule
 * Reagenda as mensagens ativas de um lote para uma nova data de disparo.
 */
export const POST = apiHandler(async (req: NextRequest, { params }: RouteParams) => {
  const { batchId } = await params;
  if (!batchId) {
    throw new ValidationError('ID do lote (batchId) é obrigatório na rota.');
  }

  const body = await req.json().catch(() => ({}));
  
  // Valida a nova data com schema Zod (API-002)
  const validation = rescheduleSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Nova data de reagendamento inválida.', validation.error.flatten().fieldErrors);
  }

  const result = await ScheduleService.rescheduleBatch(batchId, validation.data.scheduledFor);
  return NextResponse.json(result);
}, { routeName: '/api/schedule/[batchId]/reschedule (POST)', requireAuth: true });
