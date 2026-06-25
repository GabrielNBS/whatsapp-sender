import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { CampaignCommandService } from '@/server/services/CampaignCommandService';

/**
 * POST /api/campaigns/stop
 * Para a execução da campanha de mensagens ativa na fila de disparos.
 */
export const POST = apiHandler(async () => {
  await CampaignCommandService.stopCampaign();
  return NextResponse.json({ success: true });
}, { routeName: '/api/campaigns/stop (POST)', requireAuth: true });
