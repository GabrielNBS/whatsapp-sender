/**
 * API Route: /api/reports/config
 * 
 * Get and update report configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getReportService } from '@/lib/ReportService';

// GET - Get current config
export async function GET() {
  try {
    const reportService = getReportService();
    await reportService.ensureDefaultConfig();

    const config = await prisma.reportConfig.findUnique({
      where: { id: 'default' },
      include: { recipients: true },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('[API] Error fetching config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    );
  }
}

// PUT - Update config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sendImmediate, sendEngagement, engagementDelayMins, engagementTimeFixed } = body;

    const reportService = getReportService();
    await reportService.ensureDefaultConfig();

    const config = await prisma.reportConfig.update({
      where: { id: 'default' },
      data: {
        ...(sendImmediate !== undefined && { sendImmediate }),
        ...(sendEngagement !== undefined && { sendEngagement }),
        ...(engagementDelayMins !== undefined && { engagementDelayMins }),
        ...(engagementTimeFixed !== undefined && { engagementTimeFixed }),
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('[API] Error updating config:', error);
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    );
  }
}
