import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { MetricsQueryService } from '@/server/services/MetricsQueryService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics/realtime
 * Retorna métricas em tempo real com rate limit para polling do frontend.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const clientIp = 
    req.headers.get('x-forwarded-for')?.split(',')[0] || 
    req.headers.get('x-real-ip') || 
    '127.0.0.1';

  const metrics = await MetricsQueryService.getRealtimeMetrics(clientIp);
  
  const response = NextResponse.json(metrics);
  
  // Cache-Control explícito no-store (API-011)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}, { routeName: '/api/metrics/realtime (GET)', requireAuth: true });

