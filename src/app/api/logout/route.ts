import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { getWhatsAppApplicationService } from '@/server/services/service-factory';

export const POST = apiHandler(async () => {
  await getWhatsAppApplicationService().logout();
  return NextResponse.json({ success: true, message: 'Logged out' });
}, { routeName: '/api/logout' });
