import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { ScheduleService } from '@/server/services/ScheduleService';
import { createScheduleSchema } from '@/server/validators/schedule';
import { ValidationError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/schedule
 * Lista todos os lotes de agendamentos ativos ou recentemente finalizados.
 */
export const GET = apiHandler(async () => {
  const activeSchedules = await ScheduleService.listActiveSchedules();
  return NextResponse.json(activeSchedules);
}, { routeName: '/api/schedule (GET)', requireAuth: false }); // Aberto para UI local

/**
 * POST /api/schedule
 * Cria um novo lote de agendamento de mensagens.
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));

  // Valida payload com o schema Zod (API-002)
  const validation = createScheduleSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Parâmetros de agendamento inválidos.', validation.error.flatten().fieldErrors);
  }

  const result = await ScheduleService.createSchedule(validation.data);
  return NextResponse.json(result);
}, { routeName: '/api/schedule (POST)', requireAuth: true });

/**
 * DELETE /api/schedule
 * Cancela um lote de agendamento inteiro.
 */
export const DELETE = apiHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');

  if (!batchId) {
    throw new ValidationError('O batchId é obrigatório para cancelamento.');
  }

  const result = await ScheduleService.cancelScheduleBatch(batchId);
  return NextResponse.json(result);
}, { routeName: '/api/schedule (DELETE)', requireAuth: true });
