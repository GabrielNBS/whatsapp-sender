import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = whatsappService.getStatus();
  return NextResponse.json(status);
}
