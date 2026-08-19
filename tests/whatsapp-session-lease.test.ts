import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
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
});
