import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp';
import { apiHandler } from '@/lib/api-handler';
import { startScheduler } from '@/lib/scheduler';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async () => {
  startScheduler();
  const status = whatsappService.getStatus();
  return NextResponse.json(status);
}, { routeName: '/api/status' });
