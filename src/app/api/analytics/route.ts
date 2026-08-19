import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { ValidationError } from '@/lib/api-errors';
import { z } from 'zod';
import { getCurrentWorkspaceId } from '@/server/workspace';
import { analyticsQueryService } from '@/server/services/service-factory';

export const dynamic = 'force-dynamic';

const analyticsQuerySchema = z.object({
  from: z.string().datetime().or(z.string().date()).optional().nullable(),
  to: z.string().datetime().or(z.string().date()).optional().nullable(),
  limit: z.coerce.number().int().min(1).max(2000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  phones: z.string().optional().transform((value) => value
    ? Array.from(new Set(value.split(',').map((phone) => phone.trim()).filter(Boolean))).slice(0, 100)
    : []),
});

/**
 * GET /api/analytics
 * Retorna as estatísticas de envio/leitura dos contatos com paginação e rate limiting.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const queryParams = {
    from: searchParams.get('from'),
    to: searchParams.get('to'),
    limit: searchParams.get('limit') || undefined,
    offset: searchParams.get('offset') || undefined,
    phones: searchParams.get('phones') || undefined,
  };

  const validation = analyticsQuerySchema.safeParse(queryParams);
  if (!validation.success) {
    throw new ValidationError('Parâmetros de busca de analytics inválidos.', validation.error.flatten().fieldErrors);
  }

  const analytics = await analyticsQueryService.list(
    validation.data,
    clientIp,
    getCurrentWorkspaceId(),
  );

  const response = NextResponse.json(analytics);

  // Cache-Control explícito no-store (API-011)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}, { routeName: '/api/analytics (GET)', requireAuth: true });
