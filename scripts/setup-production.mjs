import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(root, '.env');
const envExamplePath = join(root, '.env.example');
const dryRun = process.argv.includes('--dry-run');
const buildOnly = process.argv.includes('--build-only');

function fail(message) {
  console.error(`\n[setup] ${message}`);
  process.exit(1);
}

function run(command, args) {
  console.log(`\n[setup] > ${command} ${args.join(' ')}`);
  if (dryRun) return;

  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) fail(`Comando falhou: ${command} ${args.join(' ')}`);
}

function getNodeVersion() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 20 || (major === 20 && minor < 9)) {
    fail(`Node.js ${process.versions.node} detectado. Use Node.js 20.9 ou superior.`);
  }
}

function readEnv(content) {
  const values = new Map();
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*["']?(.*?)["']?\s*$/);
    if (match) values.set(match[1], match[2]);
  }
  return values;
}

function setEnvValue(content, key, value) {
  const pattern = new RegExp(`^(\\s*${key}\\s*=).*?$`, 'm');
  const nextLine = `${key}="${value}"`;
  return pattern.test(content) ? content.replace(pattern, nextLine) : `${content.trimEnd()}\n${nextLine}\n`;
}

function isPlaceholder(value) {
  return !value || /substitua|gere-uma-chave|example|placeholder/i.test(value);
}

function configureEnvironment() {
  if (!existsSync(envPath) && !existsSync(envExamplePath)) {
    fail('.env.example nao foi encontrado.');
  }

  let content = existsSync(envPath)
    ? readFileSync(envPath, 'utf8')
    : readFileSync(envExamplePath, 'utf8');
  const values = readEnv(content);
  const changes = [];

  if (isPlaceholder(values.get('DATABASE_URL'))) {
    content = setEnvValue(content, 'DATABASE_URL', 'file:../dev.db');
    changes.push('DATABASE_URL');
  }

  const token = values.get('APP_ACCESS_TOKEN');
  if (isPlaceholder(token) || token.length < 32) {
    content = setEnvValue(content, 'APP_ACCESS_TOKEN', randomBytes(48).toString('base64url'));
    changes.push('APP_ACCESS_TOKEN (gerado)');
  }

  if (changes.length === 0) {
    console.log('[setup] .env ja esta configurado.');
    return;
  }

  console.log(`[setup] Configurando ${changes.join(', ')} em .env.`);
  if (!dryRun) {
    writeFileSync(envPath, content, { encoding: 'utf8', mode: 0o600 });
  }
}

async function verifyChromium() {
  console.log('\n[setup] Validando Chromium do Puppeteer...');
  if (dryRun) return;

  try {
    const { default: puppeteer } = await import('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    await browser.close();
  } catch (error) {
    fail(`Chromium/Puppeteer nao iniciou. Configure PUPPETEER_EXECUTABLE_PATH ou instale as dependencias do Chromium. ${error instanceof Error ? error.message : ''}`);
  }
}

function getPort() {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    fail('PORT precisa ser um inteiro entre 1 e 65535.');
  }
  return port;
}

function openBrowser(url) {
  if (process.platform === 'win32') {
    spawn(process.env.ComSpec || 'cmd.exe', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
  } else if (process.platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
  } else {
    spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
  }
}

async function waitForServer(url) {
  const timeoutAt = Date.now() + 30_000;
  while (Date.now() < timeoutAt) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status > 0) return;
    } catch {
      // O servidor ainda esta iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  fail(`A aplicacao nao respondeu em ${url} dentro de 30 segundos.`);
}

async function startAndOpenBrowser() {
  const port = getPort();
  const url = `http://localhost:${port}`;
  const nextCli = join(root, 'node_modules', 'next', 'dist', 'bin', 'next');

  console.log(`\n[setup] Iniciando aplicacao em ${url}...`);
  const server = spawn(process.execPath, [nextCli, 'start', '-p', String(port)], {
    cwd: root,
    stdio: 'inherit',
  });

  server.once('error', (error) => fail(`Nao foi possivel iniciar a aplicacao: ${error.message}`));
  await waitForServer(url);
  openBrowser(url);
  console.log(`[setup] Navegador aberto em ${url}. Pressione Ctrl+C para encerrar o servidor.`);

  await new Promise((resolve) => server.once('exit', resolve));
}

getNodeVersion();
configureEnvironment();
run('npm', ['ci']);
run('npm', ['run', 'db:generate']);
run('npm', ['run', 'db:migrate']);
await verifyChromium();
run('npm', ['run', 'build']);

if (dryRun) {
  console.log('\n[setup] Dry run concluido; nenhuma configuracao foi alterada, nenhum build foi executado e o navegador nao foi aberto.');
} else if (buildOnly) {
  console.log('\n[setup] Ambiente pronto. Build concluida sem iniciar o servidor (--build-only).');
} else {
  await startAndOpenBrowser();
}
