import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { CampaignCommandService } from '@/server/services/CampaignCommandService';
import { startCampaignSchema } from '@/server/validators/campaigns';
import { ValidationError } from '@/lib/api-errors';

/**
 * POST /api/campaigns/start
 * Cria uma nova campanha e enfileira seus disparos no background com idempotência (API-005 / API-008).
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));

  // Valida dados da campanha com o schema Zod (API-002)
  const validation = startCampaignSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Parâmetros de início de campanha inválidos.', validation.error.flatten().fieldErrors);
  }

  const campaign = await CampaignCommandService.startCampaign(validation.data);

  return NextResponse.json({
    success: true,
    campaignId: campaign.id,
  });
}, { routeName: '/api/campaigns/start (POST)', requireAuth: true });
