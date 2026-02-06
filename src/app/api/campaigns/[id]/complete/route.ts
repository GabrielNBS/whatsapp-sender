/**
 * API Route: /api/campaigns/[id]/complete
 * 
 * Complete a campaign and trigger immediate report
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCampaignService } from '@/lib/CampaignService';
import { getReportService } from '@/lib/ReportService';


interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Complete campaign
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { sentCount, failedCount } = body;

    const campaignService = getCampaignService();
    const reportService = getReportService();

    // Complete campaign with metrics
    const campaign = await campaignService.completeCampaign(id, {
      sentCount: sentCount ?? 0,
      failedCount: failedCount ?? 0,
    });

    // Check if immediate report should be sent
    const config = await reportService.getConfig();
    
    if (config?.sendImmediate) {
      console.log('[API] Sending immediate report for campaign:', id);
      
      const reportMessage = reportService.formatImmediateReport(campaign);
      const result = await reportService.sendReportToAllRecipients(reportMessage);
      
      if (result.success || result.sentTo.length > 0) {
        await campaignService.markImmediateReportSent(id);
        console.log('[API] Immediate report sent to:', result.sentTo);
      }
    }

    return NextResponse.json({ 
      campaign,
      reportSent: config?.sendImmediate ?? false,
    });
  } catch (error) {
    console.error('[API] Error completing campaign:', error);
    return NextResponse.json(
      { error: 'Failed to complete campaign' },
      { status: 500 }
    );
  }
}
