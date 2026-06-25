import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { CampaignCommandService } from '@/server/services/CampaignCommandService';
import { campaignQuerySchema } from '@/server/validators/campaigns';
import { ValidationError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaigns/history
 * Retorna a lista histórica de campanhas enviadas.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const limitParam = searchParams.get('limit') || '50';

  const validation = campaignQuerySchema.safeParse({ limit: limitParam });
  if (!validation.success) {
    throw new ValidationError('Parâmetros de paginação do histórico inválidos.', validation.error.flatten().fieldErrors);
  }

  const limit = validation.data.limit || 50;
  const history = await CampaignCommandService.getHistory(limit);
  return NextResponse.json(history);
}, { routeName: '/api/campaigns/history (GET)', requireAuth: false });
