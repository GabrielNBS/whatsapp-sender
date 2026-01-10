import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp';
import { startScheduler } from '@/lib/scheduler';

export const dynamic = 'force-dynamic';

export async function GET() {
  startScheduler();
  const qr = whatsappService.getQrCode();
  const status = whatsappService.getStatus();

  return NextResponse.json({ qr, status });
}
