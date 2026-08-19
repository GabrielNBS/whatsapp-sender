import { closeSync, existsSync, openSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

interface SessionLeaseMetadata {
  pid: number;
  token: string;
  createdAt: string;
  heartbeatAt: string;
}

const LEASE_HEARTBEAT_INTERVAL_MS = 5_000;
const LEASE_STALE_AFTER_MS = 30_000;

export class WhatsAppSessionBusyError extends Error {
  constructor(public readonly lockPath: string) {
    super('A sessão do WhatsApp já está sendo usada por outra instância.');
    this.name = 'WhatsAppSessionBusyError';
  }
}

/**
 * Garante que apenas uma instância tente abrir o perfil Chromium do LocalAuth.
 * O lock do Chromium continua sendo a última proteção contra concorrência.
 */
export class WhatsAppSessionLease {
  private released = false;
  private readonly processExitHandler = () => this.release();
  private readonly heartbeatTimer: NodeJS.Timeout;

  private constructor(
    private readonly lockPath: string,
    private readonly token: string,
  ) {
    process.once('exit', this.processExitHandler);
    this.heartbeatTimer = setInterval(() => this.refreshHeartbeat(), LEASE_HEARTBEAT_INTERVAL_MS);
    this.heartbeatTimer.unref();
  }

  static acquire(authPath: string): WhatsAppSessionLease {
    const browserLockPath = path.join(authPath, 'session', 'lockfile');
    if (existsSync(browserLockPath)) {
      throw new WhatsAppSessionBusyError(browserLockPath);
    }

    const lockPath = path.join(authPath, '.whatsapp-session.lock');
    const token = randomUUID();
    let fileDescriptor: number | undefined;

    try {
      fileDescriptor = openSync(lockPath, 'wx');
      const metadata: SessionLeaseMetadata = {
        pid: process.pid,
        token,
        createdAt: new Date().toISOString(),
        heartbeatAt: new Date().toISOString(),
      };
      writeFileSync(fileDescriptor, JSON.stringify(metadata), 'utf8');
      return new WhatsAppSessionLease(lockPath, token);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }

      if (isStaleLease(lockPath)) {
        try {
          unlinkSync(lockPath);
        } catch {
          throw new WhatsAppSessionBusyError(lockPath);
        }
        return WhatsAppSessionLease.acquire(authPath);
      }

      throw new WhatsAppSessionBusyError(lockPath);
    } finally {
      if (fileDescriptor !== undefined) {
        closeSync(fileDescriptor);
      }
    }
  }

  /**
   * Fecha um Chromium deixado por um processo do app que já não existe ou
   * remove um lock de perfil antigo cujo endpoint DevTools já não responde.
   */
  static async recoverStaleBrowser(authPath: string): Promise<boolean> {
    const lockPath = path.join(authPath, '.whatsapp-session.lock');
    const browserLockPath = path.join(authPath, 'session', 'lockfile');
    const hasStaleAppLease = existsSync(lockPath) && isStaleLease(lockPath);
    const hasStaleBrowserLock = existsSync(browserLockPath) && isFileOlderThan(browserLockPath);
    if (!hasStaleAppLease && !hasStaleBrowserLock) return false;

    if (hasStaleAppLease) {
      try {
        unlinkSync(lockPath);
      } catch {
        return false;
      }
    }

    const devToolsPortPath = path.join(authPath, 'session', 'DevToolsActivePort');
    if (existsSync(devToolsPortPath)) {
      const port = readFileSync(devToolsPortPath, 'utf8').split(/\r?\n/, 1)[0]?.trim();
      if (port && /^\d+$/.test(port)) {
        try {
          const { default: puppeteer } = await import('puppeteer');
          const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}` });
          await browser.close();
          return true;
        } catch {
          // DevToolsActivePort pode ser um artefato de um Chromium encerrado.
        }
      }
    }

    try {
      unlinkSync(browserLockPath);
      return true;
    } catch {
      return false;
    }
  }

  release(): void {
    if (this.released) return;
    this.released = true;
    clearInterval(this.heartbeatTimer);
    process.off('exit', this.processExitHandler);

    try {
      const metadata = JSON.parse(readFileSync(this.lockPath, 'utf8')) as Partial<SessionLeaseMetadata>;
      if (metadata.token === this.token) {
        unlinkSync(this.lockPath);
      }
    } catch {
      // O processo pode estar encerrando ou o lock já pode ter sido removido.
    }
  }

  private refreshHeartbeat(): void {
    if (this.released) return;

    try {
      const metadata = JSON.parse(readFileSync(this.lockPath, 'utf8')) as Partial<SessionLeaseMetadata>;
      if (metadata.token !== this.token) return;

      writeFileSync(
        this.lockPath,
        JSON.stringify({ ...metadata, heartbeatAt: new Date().toISOString() }),
        'utf8',
      );
    } catch {
      // O processo pode estar encerrando ou o lock pode ter sido removido.
    }
  }
}

function isStaleLease(lockPath: string): boolean {
  try {
    const metadata = JSON.parse(readFileSync(lockPath, 'utf8')) as Partial<SessionLeaseMetadata>;
    const heartbeatAt = Date.parse(metadata.heartbeatAt ?? '');
    if (Number.isFinite(heartbeatAt)) {
      return Date.now() - heartbeatAt > LEASE_STALE_AFTER_MS;
    }

    // Locks criados por versões anteriores não tinham heartbeat. O limite
    // impede que um PID reutilizado mantenha uma sessão antiga bloqueada.
    const createdAt = Date.parse(metadata.createdAt ?? '');
    if (Number.isFinite(createdAt) && Date.now() - createdAt > LEASE_STALE_AFTER_MS) {
      return true;
    }

    const pid = metadata.pid;
    if (typeof pid !== 'number' || !Number.isInteger(pid) || pid <= 0) return true;

    process.kill(pid, 0);
    return false;
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    return code === 'ESRCH' || code === 'ENOENT' || code === undefined;
  }
}

function isFileOlderThan(filePath: string): boolean {
  try {
    return Date.now() - statSync(filePath).mtimeMs > LEASE_STALE_AFTER_MS;
  } catch {
    return false;
  }
}
