/**
 * API Route: /api/campaigns
 * 
 * Create and manage campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCampaignService } from '@/lib/CampaignService';

// GET - List recent campaigns
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const campaignService = getCampaignService();
    const campaigns = await campaignService.getRecentCampaigns(limit);

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('[API] Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, templateName, totalContacts } = body;

    if (!name || totalContacts === undefined) {
      return NextResponse.json(
        { error: 'Name and totalContacts are required' },
        { status: 400 }
      );
    }

    const campaignService = getCampaignService();
    const campaign = await campaignService.createCampaign({
      name,
      templateName,
      totalContacts,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
