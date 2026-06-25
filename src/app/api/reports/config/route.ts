import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { ReportConfigService } from '@/server/services/ReportConfigService';
import { reportConfigSchema } from '@/server/validators/reports';
import { ValidationError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/config
 * Retorna as configurações de relatórios.
 */
export const GET = apiHandler(async () => {
  const config = await ReportConfigService.getConfig();
  return NextResponse.json(config);
}, { routeName: '/api/reports/config (GET)', requireAuth: false });

/**
 * PATCH /api/reports/config
 * Atualiza parcialmente as configurações com whitelist rígida (API-009).
 */
export const PATCH = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));

  // Valida e aplica strict no body para evitar mass assignment
  const validation = reportConfigSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Parâmetros de configuração de relatórios inválidos.', validation.error.flatten().fieldErrors);
  }

  const config = await ReportConfigService.updateConfig(validation.data);
  return NextResponse.json(config);
}, { routeName: '/api/reports/config (PATCH)', requireAuth: true });

/**
 * PUT /api/reports/config
 * Mantém suporte a PUT legados mapeando para o mesmo comportamento do PATCH.
 */
export const PUT = PATCH;
