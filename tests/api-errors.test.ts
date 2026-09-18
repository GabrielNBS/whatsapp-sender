import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { mapPrismaError, ServiceUnavailableError, ConflictError, NotFoundError, ValidationError } from '@/lib/api-errors';
import { normalizeDatabaseUrl } from '@/lib/db';

describe('mapPrismaError', () => {
  it('maps P1008 (timeout) to ServiceUnavailableError with status 503', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Operations timed out', {
      code: 'P1008',
      clientVersion: '5.10.2',
    });

    const mapped = mapPrismaError(error);
    expect(mapped).toBeInstanceOf(ServiceUnavailableError);
    expect(mapped.statusCode).toBe(503);
    expect(mapped.message).toContain('banco de dados demorou para responder');
  });

  it('maps connection and pool errors (P1001, P2024) to 503', () => {
    const connError = new Prisma.PrismaClientKnownRequestError('Connection failed', {
      code: 'P1001',
      clientVersion: '5.10.2',
    });
    expect(mapPrismaError(connError).statusCode).toBe(503);

    const poolError = new Prisma.PrismaClientKnownRequestError('Pool timeout', {
      code: 'P2024',
      clientVersion: '5.10.2',
    });
    expect(mapPrismaError(poolError).statusCode).toBe(503);
  });

  it('maps transaction concurrency conflict (P2034) to 503', () => {
    const conflictError = new Prisma.PrismaClientKnownRequestError('Deadlock conflict', {
      code: 'P2034',
      clientVersion: '5.10.2',
    });
    const mapped = mapPrismaError(conflictError);
    expect(mapped.statusCode).toBe(503);
    expect(mapped.code).toBe('TRANSACTION_CONFLICT');
  });

  it('maps P2002 to ConflictError with status 409', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '5.10.2',
      meta: { target: ['phone'] },
    });
    const mapped = mapPrismaError(error);
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped.statusCode).toBe(409);
    expect(mapped.message).toContain('phone');
  });

  it('maps P2025 to NotFoundError with status 404', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.10.2',
    });
    const mapped = mapPrismaError(error);
    expect(mapped).toBeInstanceOf(NotFoundError);
    expect(mapped.statusCode).toBe(404);
  });

  it('maps P2000 to ValidationError with status 400', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Value too long', {
      code: 'P2000',
      clientVersion: '5.10.2',
    });
    const mapped = mapPrismaError(error);
    expect(mapped).toBeInstanceOf(ValidationError);
    expect(mapped.statusCode).toBe(400);
  });
});

describe('normalizeDatabaseUrl', () => {
  it('appends connection_limit=1 and socket_timeout=10 to file: URLs lacking connection_limit', () => {
    expect(normalizeDatabaseUrl('file:./dev.db')).toBe('file:./dev.db?connection_limit=1&socket_timeout=10');
    expect(normalizeDatabaseUrl('file:./dev.db?foo=bar')).toBe('file:./dev.db?foo=bar&connection_limit=1&socket_timeout=10');
  });

  it('preserves existing connection_limit if already set', () => {
    expect(normalizeDatabaseUrl('file:./dev.db?connection_limit=2')).toBe('file:./dev.db?connection_limit=2');
  });

  it('preserves non-file URLs (e.g. postgres)', () => {
    expect(normalizeDatabaseUrl('postgresql://user:pass@localhost:5432/db')).toBe('postgresql://user:pass@localhost:5432/db');
  });
});
