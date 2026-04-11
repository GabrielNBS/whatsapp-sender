import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp';
import { apiHandler } from '@/lib/api-handler';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async () => {
  const status = whatsappService.getStatus();
  return NextResponse.json(status);
}, { routeName: '/api/status' });
