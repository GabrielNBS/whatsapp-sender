import { Prisma } from '@prisma/client';
import { ConflictError } from './api-errors';
import { prisma } from './db';

const DEFAULT_TTL_MS = 5 * 60 * 1000;

export interface IdempotencyReservation {
  complete(): Promise<void>;
  abort(): Promise<void>;
}

export async function beginIdempotentOperation(
  workspaceId: string,
  key?: string | null,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<IdempotencyReservation> {
  if (!key) {
    return {
      async complete() {},
      async abort() {},
    };
  }

  const expiresAt = new Date(Date.now() + ttlMs);

  await prisma.idempotencyRecord.deleteMany({
    where: { workspaceId, key, expiresAt: { lte: new Date() } },
  });

  let reservationId: string;
  try {
    const reservation = await prisma.idempotencyRecord.create({
      data: { workspaceId, key, expiresAt },
      select: { id: true },
    });
    reservationId = reservation.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Esta requisicao ja foi processada recentemente.');
    }
    throw error;
  }

  return {
    async complete() {
      await prisma.idempotencyRecord.updateMany({
        where: { id: reservationId, workspaceId },
        data: { state: 'COMPLETED', expiresAt: new Date(Date.now() + ttlMs) },
      });
    },
    async abort() {
      await prisma.idempotencyRecord.deleteMany({
        where: { id: reservationId, workspaceId, state: 'IN_PROGRESS' },
      });
    },
  };
}
