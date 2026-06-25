import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { startScheduler } from '@/lib/scheduler';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/init
 * Endpoint administrativo para inicialização manual do scheduler de background.
 */
export const POST = apiHandler(async () => {
  startScheduler();
  return NextResponse.json({ success: true, message: 'Scheduler inicializado com sucesso.' });
}, { routeName: '/api/admin/init (POST)', requireAuth: true });
