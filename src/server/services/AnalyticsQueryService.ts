import type { PrismaClient, Prisma } from '@prisma/client';
import { API_RATE_LIMITS } from '@/constants/api';
import { checkRateLimit } from '@/lib/rate-limit';

export interface AnalyticsQuery {
  from?: string | null;
  to?: string | null;
  limit: number;
  offset: number;
  phones: string[];
}

export class AnalyticsQueryService {
  constructor(private readonly database: PrismaClient) {}

  async list(query: AnalyticsQuery, clientIp: string, workspaceId: string) {
    checkRateLimit(
      `analytics-poll-${workspaceId}-${clientIp}`,
      API_RATE_LIMITS.POLLING_LIMIT,
      API_RATE_LIMITS.POLLING_WINDOW_MS,
    );

    const where: Prisma.ContactAnalyticsWhereInput = { workspaceId };
    if (query.phones.length > 0) {
      where.phone = { in: query.phones };
    }
    if (query.from || query.to) {
      where.OR = [];
      if (query.from) {
        const fromDate = new Date(query.from);
        where.OR.push({ lastSentAt: { gte: fromDate } }, { lastReadAt: { gte: fromDate } });
      }
      if (query.to) {
        const toDate = new Date(query.to);
        where.OR.push({ lastSentAt: { lte: toDate } }, { lastReadAt: { lte: toDate } });
      }
    }

    return this.database.contactAnalytics.findMany({
      where,
      take: query.limit,
      skip: query.offset,
      orderBy: { updatedAt: 'desc' },
    });
  }
}

