import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be configured before starting the service.')
}

export function normalizeDatabaseUrl(rawUrl: string): string {
  if (rawUrl.startsWith('file:') && !rawUrl.includes('connection_limit=')) {
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}connection_limit=1&socket_timeout=10`;
  }
  return rawUrl;
}

const resolvedUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

const globalForPrisma = global as unknown as { prisma: PrismaClient; sqlitePragmasInitialized?: boolean };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: { url: resolvedUrl },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

if (resolvedUrl.startsWith('file:') && !globalForPrisma.sqlitePragmasInitialized) {
  globalForPrisma.sqlitePragmasInitialized = true;
  void prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;').catch(() => {});
  void prisma.$queryRawUnsafe('PRAGMA busy_timeout=5000;').catch(() => {});
  void prisma.$queryRawUnsafe('PRAGMA synchronous=NORMAL;').catch(() => {});
}
