import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const forgeArgs = process.argv.slice(2);

if (forgeArgs.length === 0) {
  throw new Error('Electron Forge command not provided.');
}

const isWindows = process.platform === 'win32';
const tempRoot = isWindows ? 'C:\\wstmp' : path.join(projectRoot, '.tmp');
const outRoot = isWindows ? 'C:\\wsdist' : path.join(projectRoot, 'out');

mkdirSync(tempRoot, { recursive: true });
mkdirSync(outRoot, { recursive: true });

const runner = isWindows
  ? path.join(projectRoot, 'node_modules', '.bin', 'electron-forge.cmd')
  : path.join(projectRoot, 'node_modules', '.bin', 'electron-forge');
const args = [...forgeArgs, '--outDir', outRoot];
const result = spawnSync(runner, args, {
  cwd: projectRoot,
  env: {
    ...process.env,
    TEMP: tempRoot,
    TMP: tempRoot,
  },
  shell: isWindows,
  stdio: 'inherit',
});

if (typeof result.status === 'number' && result.status !== 0) {
  process.exit(result.status);
}

if (result.error) {
  throw result.error;
}
