import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiHandler } from '@/lib/api-handler';
import { ValidationError } from '@/lib/api-errors';
import { checkRateLimit } from '@/lib/rate-limit';
import { API_RATE_LIMITS } from '@/constants/api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const analyticsQuerySchema = z.object({
  from: z.string().datetime().or(z.string().date()).optional().nullable(),
  to: z.string().datetime().or(z.string().date()).optional().nullable(),
  limit: z.coerce.number().int().min(1).max(2000).default(1000),
  offset: z.coerce.number().int().min(0).default(0),
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

  // Rate limiting para polling frequente de analytics (API-011)
  checkRateLimit(
    `analytics-poll-${clientIp}`, 
    API_RATE_LIMITS.POLLING_LIMIT || 120, 
    API_RATE_LIMITS.POLLING_WINDOW_MS || 60000
  );

  const queryParams = {
    from: searchParams.get('from'),
    to: searchParams.get('to'),
    limit: searchParams.get('limit') || undefined,
    offset: searchParams.get('offset') || undefined,
  };

  const validation = analyticsQuerySchema.safeParse(queryParams);
  if (!validation.success) {
    throw new ValidationError('Parâmetros de busca de analytics inválidos.', validation.error.flatten().fieldErrors);
  }

  const { from, to, limit, offset } = validation.data;

  // Monta filtros
  const where: any = {};
  if (from || to) {
    where.OR = [];
    if (from) {
      const fromDate = new Date(from);
      where.OR.push(
        { lastSentAt: { gte: fromDate } },
        { lastReadAt: { gte: fromDate } }
      );
    }
    if (to) {
      const toDate = new Date(to);
      where.OR.push(
        { lastSentAt: { lte: toDate } },
        { lastReadAt: { lte: toDate } }
      );
    }
  }

  const analytics = await prisma.contactAnalytics.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: { updatedAt: 'desc' }
  });

  const response = NextResponse.json(analytics);
  
  // Cache-Control explícito no-store (API-011)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}, { routeName: '/api/analytics (GET)', requireAuth: true });