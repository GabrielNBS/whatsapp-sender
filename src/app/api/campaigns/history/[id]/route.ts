import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/api-errors';
import { CampaignCommandService } from '@/server/services/CampaignCommandService';
import { getCurrentWorkspaceId } from '@/server/workspace';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = apiHandler(async (_req: NextRequest, { params }: RouteParams) => {
  const { id } = await params;
  const campaign = await CampaignCommandService.getHistoryItem(id, getCurrentWorkspaceId());
  if (!campaign) throw new NotFoundError('Campanha não encontrada.');
  return NextResponse.json(campaign);
}, { routeName: '/api/campaigns/history/[id] (GET)', requireAuth: true });
