import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

function violations(files: string[], forbidden: RegExp): string[] {
  return files
    .filter((file) => forbidden.test(readFileSync(file, 'utf8')))
    .map((file) => relative(projectRoot, file));
}

describe('architecture boundaries', () => {
  it('keeps route handlers isolated from persistence and WhatsApp implementations', () => {
    const routes = sourceFiles(join(projectRoot, 'src', 'app', 'api'))
      .filter((file) => file.endsWith('route.ts'));

    expect(violations(routes, /@\/lib\/(?:db|whatsapp)|\bprisma\b|\bwhatsappService\b/)).toEqual([]);
  });

  it('keeps application services independent from HTTP validators', () => {
    const services = sourceFiles(join(projectRoot, 'src', 'server', 'services'));
    expect(violations(services, /server\/validators|\.\.\/validators/)).toEqual([]);
  });

  it('keeps hooks independent from the concrete notification library', () => {
    const hooks = sourceFiles(join(projectRoot, 'src', 'hooks'));
    expect(violations(hooks, /from ['"]sonner['"]/)).toEqual([]);
  });

  it('uses the shared HTTP client in frontend API services', () => {
    const serviceFiles = sourceFiles(join(projectRoot, 'src', 'services'))
      .filter((file) => !file.endsWith(join('http', 'client.ts')));

    expect(violations(serviceFiles, /\bfetch\s*\(/)).toEqual([]);
  });

  it('keeps domain engagement rules free from presentation dependencies', () => {
    const engagementService = readFileSync(
      join(projectRoot, 'src', 'lib', 'EngagementService.ts'),
      'utf8',
    );

    expect(engagementService).not.toMatch(/lucide-react|className|Badge|format\(/);
  });
});
