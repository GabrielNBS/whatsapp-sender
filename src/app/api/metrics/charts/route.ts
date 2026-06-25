import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { MetricsQueryService } from '@/server/services/MetricsQueryService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics/charts
 * Retorna dados agregados para exibição de gráficos no dashboard.
 */
export const GET = apiHandler(async () => {
  const data = await MetricsQueryService.getDashboardChartsData();
  
  const response = NextResponse.json(data);
  
  // Cache-Control explícito no-store (API-011)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}, { routeName: '/api/metrics/charts (GET)', requireAuth: true });

