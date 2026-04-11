import { NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp';
import { apiHandler } from '@/lib/api-handler';

export const POST = apiHandler(async () => {
  await whatsappService.logout();
  return NextResponse.json({ success: true, message: 'Logged out' });
}, { routeName: '/api/logout' });
