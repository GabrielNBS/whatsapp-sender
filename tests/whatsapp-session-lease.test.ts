import { existsSync, mkdtempSync, mkdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { WhatsAppSessionBusyError, WhatsAppSessionLease } from '@/infrastructure/whatsapp/WhatsAppSessionLease';

const temporaryPaths: string[] = [];

function createAuthPath() {
  const authPath = mkdtempSync(path.join(os.tmpdir(), 'whatsapp-session-'));
  temporaryPaths.push(authPath);
  return authPath;
}

afterEach(() => {
  for (const authPath of temporaryPaths.splice(0)) {
    rmSync(authPath, { recursive: true, force: true });
  }
});

describe('WhatsAppSessionLease', () => {
  it('allows one owner and rejects a concurrent owner', () => {
    const authPath = createAuthPath();
    const firstLease = WhatsAppSessionLease.acquire(authPath);

    expect(() => WhatsAppSessionLease.acquire(authPath)).toThrow(WhatsAppSessionBusyError);

    firstLease.release();
    const secondLease = WhatsAppSessionLease.acquire(authPath);
    secondLease.release();
  });

  it('rejects an existing Chromium session lock before initialization', () => {
    const authPath = createAuthPath();
    mkdirSync(path.join(authPath, 'session'));
    writeFileSync(path.join(authPath, 'session', 'lockfile'), '');

    expect(() => WhatsAppSessionLease.acquire(authPath)).toThrow(WhatsAppSessionBusyError);
  });

  it('recovers an expired lease even when its PID has been reused', () => {
    const authPath = createAuthPath();
    const staleAt = new Date(Date.now() - 60_000).toISOString();
    writeFileSync(
      path.join(authPath, '.whatsapp-session.lock'),
      JSON.stringify({
        pid: process.pid,
        token: 'stale-token',
        createdAt: staleAt,
        heartbeatAt: staleAt,
      }),
    );

    const lease = WhatsAppSessionLease.acquire(authPath);
    lease.release();
  });

  it('removes an old Chromium lock when the app lease is already gone', async () => {
    const authPath = createAuthPath();
    const sessionPath = path.join(authPath, 'session');
    const browserLockPath = path.join(sessionPath, 'lockfile');
    mkdirSync(sessionPath);
    writeFileSync(browserLockPath, '');
    const staleTime = new Date(Date.now() - 60_000);
    utimesSync(browserLockPath, staleTime, staleTime);

    await expect(WhatsAppSessionLease.recoverStaleBrowser(authPath)).resolves.toBe(true);
    expect(existsSync(browserLockPath)).toBe(false);
  });
});
