import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp';
import { startScheduler } from '@/lib/scheduler';
import { apiHandler } from '@/lib/api-handler';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async () => {
  startScheduler();
  const qr = whatsappService.getQrCode();
  const status = whatsappService.getStatus();

  return NextResponse.json({ qr, status });
}, { routeName: '/api/qr' });
