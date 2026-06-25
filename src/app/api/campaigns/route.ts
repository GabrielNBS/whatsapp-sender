import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { getCampaignService } from '@/lib/CampaignService';
import { campaignQuerySchema } from '@/server/validators/campaigns';
import { ValidationError } from '@/lib/api-errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createCampaignBodySchema = z.object({
  name: z.string().min(1, 'O nome da campanha é obrigatório').trim(),
  templateName: z.string().optional().nullable(),
  totalContacts: z.number().int().min(1, 'A quantidade total de contatos deve ser de no mínimo 1'),
});

/**
 * GET /api/campaigns
 * Lista as campanhas recentes.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const limitParam = searchParams.get('limit') || '10';

  const validation = campaignQuerySchema.safeParse({ limit: limitParam });
  if (!validation.success) {
    throw new ValidationError('Parâmetros de paginação inválidos.', validation.error.flatten().fieldErrors);
  }

  const limit = validation.data.limit || 10;
  const campaigns = await getCampaignService().getRecentCampaigns(limit);
  return NextResponse.json(campaigns);
}, { routeName: '/api/campaigns (GET)', requireAuth: false });

/**
 * POST /api/campaigns
 * Cria uma nova campanha manual.
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));

  const validation = createCampaignBodySchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Dados de campanha inválidos.', validation.error.flatten().fieldErrors);
  }

  const campaign = await getCampaignService().createCampaign({
    name: validation.data.name,
    templateName: validation.data.templateName || undefined,
    totalContacts: validation.data.totalContacts,
  });

  return NextResponse.json(campaign, { status: 201 });
}, { routeName: '/api/campaigns (POST)', requireAuth: true });
