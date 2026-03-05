import { NextResponse } from 'next/server';
import { getMetricsService } from '@/lib/MetricsService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const metricsService = getMetricsService();
    const data = await metricsService.getDashboardChartsData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch dashboard charts data:', error);
    return NextResponse.json({ error: 'Failed to fetch charts data' }, { status: 500 });
  }
}
