import { closeSync, existsSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

interface SessionLeaseMetadata {
  pid: number;
  token: string;
  createdAt: string;
}

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

  private constructor(
    private readonly lockPath: string,
    private readonly token: string,
  ) {
    process.once('exit', this.processExitHandler);
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
      };
      writeFileSync(fileDescriptor, JSON.stringify(metadata), 'utf8');
      return new WhatsAppSessionLease(lockPath, token);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }

      if (isStaleLease(lockPath)) {
        unlinkSync(lockPath);
        return WhatsAppSessionLease.acquire(authPath);
      }

      throw new WhatsAppSessionBusyError(lockPath);
    } finally {
      if (fileDescriptor !== undefined) {
        closeSync(fileDescriptor);
      }
    }
  }

  release(): void {
    if (this.released) return;
    this.released = true;
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
}

function isStaleLease(lockPath: string): boolean {
  try {
    const metadata = JSON.parse(readFileSync(lockPath, 'utf8')) as Partial<SessionLeaseMetadata>;
    const pid = metadata.pid;
    if (typeof pid !== 'number' || !Number.isInteger(pid) || pid <= 0) return true;

    process.kill(pid, 0);
    return false;
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    return code === 'ESRCH' || code === 'ENOENT' || code === undefined;
  }
}
