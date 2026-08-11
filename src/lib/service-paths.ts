import { mkdirSync } from 'node:fs';
import path from 'node:path';

export function resolveWhatsAppAuthPath(): string {
  const authPath = path.resolve(
    /* turbopackIgnore: true */ process.env.WWEBJS_AUTH_PATH || '.wwebjs_auth',
  );
  mkdirSync(authPath, { recursive: true });
  return authPath;
}
