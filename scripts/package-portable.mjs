import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packager = require('@electron/packager');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const desktopStageDir = path.join(projectRoot, '.desktop-stage');
const outRoot = path.join(projectRoot, 'out');
const packagedRoot = path.join(outRoot, 'package');
const zipDir = path.join(outRoot, 'make', 'zip', 'win32', 'x64');
const packageJson = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
const zipPath = path.join(
  zipDir,
  `whatsapp-sender-win32-x64-${packageJson.version}.zip`,
);

if (!existsSync(desktopStageDir)) {
  throw new Error('Desktop stage not found. Run "npm run desktop:prepare-bundle" before packaging.');
}

if (process.platform === 'win32') {
  const tempRoot = 'C:\\wstmp';
  mkdirSync(tempRoot, { recursive: true });
  process.env.TEMP = tempRoot;
  process.env.TMP = tempRoot;
}

rmSync(packagedRoot, { recursive: true, force: true });
rmSync(zipPath, { recursive: true, force: true });
mkdirSync(packagedRoot, { recursive: true });
mkdirSync(zipDir, { recursive: true });

const packagedAppPaths = await packager.packager({
  arch: 'x64',
  asar: false,
  dir: desktopStageDir,
  executableName: 'whatsapp-sender',
  out: packagedRoot,
  overwrite: true,
  platform: 'win32',
  prune: false,
  quiet: false,
});

const packagedAppDir = packagedAppPaths[0];
if (!packagedAppDir) {
  throw new Error('electron-packager did not return an output directory.');
}

const tarResult = spawnSync(
  'tar',
  ['-a', '-cf', zipPath, '-C', path.dirname(packagedAppDir), path.basename(packagedAppDir)],
  {
    cwd: projectRoot,
    stdio: 'inherit',
  },
);

if (tarResult.status !== 0) {
  throw new Error(`Failed to create portable ZIP. Exit code: ${tarResult.status ?? 'unknown'}`);
}

console.log(`Portable ZIP created at ${zipPath}`);
