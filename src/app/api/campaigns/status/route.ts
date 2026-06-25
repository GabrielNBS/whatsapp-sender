import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { CampaignCommandService } from '@/server/services/CampaignCommandService';
import { campaignQuerySchema } from '@/server/validators/campaigns';
import { ValidationError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaigns/status
 * Obtém o status da fila ativa e os logs de processamento desde o offset fornecido.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const logOffsetParam = searchParams.get('logOffset') || '0';

  const validation = campaignQuerySchema.safeParse({ logOffset: logOffsetParam });
  if (!validation.success) {
    throw new ValidationError('Parâmetros de status inválidos.', validation.error.flatten().fieldErrors);
  }

  const status = await CampaignCommandService.getStatus(validation.data.logOffset || 0);
  return NextResponse.json(status);
}, { routeName: '/api/campaigns/status (GET)', requireAuth: false });
