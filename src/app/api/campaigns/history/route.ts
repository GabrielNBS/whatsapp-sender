import { NextRequest, NextResponse } from 'next/server';
import { getCampaignService } from '@/lib/CampaignService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');

    const campaignService = getCampaignService();
    const history = await campaignService.getCampaignHistory(limit);

    return NextResponse.json(history);
  } catch (error: unknown) {
    console.error('[API] Error fetching campaign history:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || 'Failed to fetch campaign history' },
      { status: 500 }
    );
  }
}
