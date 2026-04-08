import {
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const desktopStageDir = path.join(projectRoot, '.desktop-stage');
const standaloneDir = path.join(projectRoot, '.next', 'standalone');
const standaloneServerPath = path.join(standaloneDir, 'server.js');
const standaloneNodeModulesDir = path.join(standaloneDir, 'node_modules');
const projectPackageJson = JSON.parse(
  readFileSync(path.join(projectRoot, 'package.json'), 'utf8'),
);

function copyDirectory(sourcePath, targetPath) {
  if (!existsSync(sourcePath)) {
    return;
  }

  mkdirSync(path.dirname(targetPath), { recursive: true });
  cpSync(sourcePath, targetPath, { recursive: true, force: true });
}

function flattenLinkedEntries(directoryPath) {
  if (!existsSync(directoryPath)) {
    return;
  }

  const entries = readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);
    const entryStats = lstatSync(entryPath);

    if (entryStats.isSymbolicLink()) {
      const resolvedPath = realpathSync(entryPath);
      const resolvedStats = statSync(resolvedPath);

      rmSync(entryPath, { recursive: true, force: true });

      if (resolvedStats.isDirectory()) {
        cpSync(resolvedPath, entryPath, { recursive: true, force: true });
        flattenLinkedEntries(entryPath);
      } else {
        mkdirSync(path.dirname(entryPath), { recursive: true });
        copyFileSync(resolvedPath, entryPath);
      }

      continue;
    }

    if (entry.isDirectory()) {
      flattenLinkedEntries(entryPath);
    }
  }
}

if (!existsSync(standaloneServerPath)) {
  throw new Error('Standalone server.js not found. Run "npm run build" before preparing the Electron bundle.');
}

copyDirectory(path.join(projectRoot, 'public'), path.join(standaloneDir, 'public'));
copyDirectory(path.join(projectRoot, '.next', 'static'), path.join(standaloneDir, '.next', 'static'));
copyDirectory(path.join(projectRoot, 'prisma'), path.join(standaloneDir, 'prisma'));
copyDirectory(path.join(projectRoot, 'node_modules', '.prisma'), path.join(standaloneNodeModulesDir, '.prisma'));
copyDirectory(path.join(projectRoot, 'node_modules', '@prisma'), path.join(standaloneNodeModulesDir, '@prisma'));
flattenLinkedEntries(standaloneDir);

rmSync(desktopStageDir, { recursive: true, force: true });
mkdirSync(desktopStageDir, { recursive: true });
copyFileSync(path.join(standaloneDir, 'server.js'), path.join(desktopStageDir, 'server.js'));
copyDirectory(path.join(standaloneDir, '.next'), path.join(desktopStageDir, '.next'));
copyDirectory(path.join(standaloneDir, 'node_modules'), path.join(desktopStageDir, 'node_modules'));
copyDirectory(path.join(standaloneDir, 'public'), path.join(desktopStageDir, 'public'));
copyDirectory(path.join(standaloneDir, 'prisma'), path.join(desktopStageDir, 'prisma'));
copyDirectory(path.join(projectRoot, 'desktop-assets'), path.join(desktopStageDir, 'desktop-assets'));
copyFileSync(path.join(projectRoot, 'electron', 'main.cjs'), path.join(desktopStageDir, 'main.cjs'));
writeFileSync(
  path.join(desktopStageDir, 'package.json'),
  JSON.stringify(
    {
      name: projectPackageJson.name,
      version: projectPackageJson.version,
      description: projectPackageJson.description,
      author: projectPackageJson.author,
      license: projectPackageJson.license,
      main: 'main.cjs',
      productName: 'WhatsApp Sender',
    },
    null,
    2,
  ) + '\n',
);
flattenLinkedEntries(desktopStageDir);

console.log('Electron bundle prepared successfully.');
