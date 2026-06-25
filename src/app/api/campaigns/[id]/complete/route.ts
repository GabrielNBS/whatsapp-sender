import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { CampaignCommandService } from '@/server/services/CampaignCommandService';
import { campaignCompleteSchema } from '@/server/validators/campaigns';
import { ValidationError } from '@/lib/api-errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/campaigns/[id]/complete
 * Marca uma campanha como concluída, salva estatísticas finais e dispara relatórios se configurado (API-008).
 */
export const POST = apiHandler(async (req: NextRequest, { params }: RouteParams) => {
  const { id } = await params;
  if (!id) {
    throw new ValidationError('ID da campanha é obrigatório na rota.');
  }

  const body = await req.json().catch(() => ({}));

  // Valida estatísticas finais usando schema Zod (API-002)
  const validation = campaignCompleteSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Métricas de conclusão de campanha inválidas.', validation.error.flatten().fieldErrors);
  }

  const result = await CampaignCommandService.completeCampaign(id, validation.data);

  return NextResponse.json(result);
}, { routeName: '/api/campaigns/[id]/complete (POST)', requireAuth: true });
