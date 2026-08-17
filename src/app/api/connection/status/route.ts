import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { MetricsQueryService } from '@/server/services/MetricsQueryService';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (req: NextRequest) => {
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]
    || req.headers.get('x-real-ip')
    || '127.0.0.1';

  const connection = await MetricsQueryService.getConnectionStatus(clientIp);
  return NextResponse.json(connection, {
    headers: { 'Cache-Control': 'no-store' },
  });
}, { routeName: '/api/connection/status (GET)', requireAuth: true });
