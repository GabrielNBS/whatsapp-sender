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

  if (existsSync(targetPath)) {
    try {
      if (realpathSync(sourcePath) === realpathSync(targetPath)) {
        return;
      }
    } catch {
      // If realpath resolution fails, fall back to a normal copy attempt.
    }
  }

  mkdirSync(path.dirname(targetPath), { recursive: true });
  cpSync(sourcePath, targetPath, { recursive: true, force: true });
}

function removePath(targetPath) {
  rmSync(targetPath, { recursive: true, force: true });
}

function copyFileIfPresent(sourcePath, targetPath) {
  if (!existsSync(sourcePath)) {
    return;
  }

  mkdirSync(path.dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
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

function prunePrismaRuntime(runtimeRoot) {
  const prismaEnginesDir = path.join(runtimeRoot, 'node_modules', '@prisma', 'engines');
  const prismaClientRuntimeDir = path.join(runtimeRoot, 'node_modules', '@prisma', 'client', 'runtime');
  const generatedPrismaClientDir = path.join(runtimeRoot, 'node_modules', '.prisma', 'client');

  removePath(path.join(prismaEnginesDir, 'node_modules', '.cache'));
  removePath(path.join(prismaEnginesDir, 'schema-engine-windows.exe'));
  removePath(path.join(prismaEnginesDir, 'schema-engine-windows.exe.node'));

  for (const fileName of [
    'query_engine_bg.mysql.wasm',
    'query_engine_bg.mysql.js',
    'query_engine_bg.mysql.js.map',
    'query_engine_bg.postgresql.wasm',
    'query_engine_bg.postgresql.js',
    'query_engine_bg.postgresql.js.map',
    'query_engine_bg.sqlite.wasm',
    'query_engine_bg.sqlite.js',
    'query_engine_bg.sqlite.js.map',
    'binary.js',
    'binary.d.ts',
    'edge.js',
    'edge.d.ts',
    'react-native.js',
    'react-native.d.ts',
    'wasm.js',
    'wasm.d.ts',
  ]) {
    removePath(path.join(prismaClientRuntimeDir, fileName));
  }

  for (const fileName of [
    'query_engine-windows.dll.node.tmp1136',
    'query_engine-windows.dll.node.tmp',
    'query_engine-windows.dll.node.tmp0',
    'index-browser.js',
    'edge.js',
    'edge.d.ts',
    'wasm.js',
    'wasm.d.ts',
  ]) {
    removePath(path.join(generatedPrismaClientDir, fileName));
  }

  if (existsSync(generatedPrismaClientDir)) {
    const generatedFiles = readdirSync(generatedPrismaClientDir);
    for (const fileName of generatedFiles) {
      if (fileName.startsWith('query_engine-windows.dll.node.tmp')) {
        removePath(path.join(generatedPrismaClientDir, fileName));
      }
    }
  }
}

function pruneNodeModules(nodeModulesRoot) {
  removePath(path.join(nodeModulesRoot, '.pnpm'));
  removePath(path.join(nodeModulesRoot, '.cache'));
}

function materializeTracedPackage(targetPath, sourcePath) {
  if (!existsSync(sourcePath)) {
    return;
  }

  removePath(targetPath);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  cpSync(realpathSync(sourcePath), targetPath, { recursive: true, force: true });
}

if (!existsSync(standaloneServerPath)) {
  throw new Error('Standalone server.js not found. Run "npm run build" before preparing the Electron bundle.');
}

copyDirectory(path.join(projectRoot, 'public'), path.join(standaloneDir, 'public'));
copyDirectory(path.join(projectRoot, '.next', 'static'), path.join(standaloneDir, '.next', 'static'));
copyDirectory(path.join(projectRoot, 'prisma'), path.join(standaloneDir, 'prisma'));
copyDirectory(path.join(projectRoot, 'node_modules', '.prisma'), path.join(standaloneNodeModulesDir, '.prisma'));
copyDirectory(
  path.join(projectRoot, 'node_modules', '@prisma', 'debug'),
  path.join(standaloneNodeModulesDir, '@prisma', 'debug'),
);
copyDirectory(
  path.join(projectRoot, 'node_modules', '@prisma', 'engines'),
  path.join(standaloneNodeModulesDir, '@prisma', 'engines'),
);
copyDirectory(
  path.join(projectRoot, 'node_modules', '@prisma', 'engines-version'),
  path.join(standaloneNodeModulesDir, '@prisma', 'engines-version'),
);
copyDirectory(
  path.join(projectRoot, 'node_modules', '@prisma', 'get-platform'),
  path.join(standaloneNodeModulesDir, '@prisma', 'get-platform'),
);
flattenLinkedEntries(standaloneDir);
prunePrismaRuntime(standaloneDir);

rmSync(desktopStageDir, { recursive: true, force: true });
mkdirSync(desktopStageDir, { recursive: true });
copyFileSync(path.join(standaloneDir, 'server.js'), path.join(desktopStageDir, 'server.js'));
copyDirectory(path.join(standaloneDir, '.next'), path.join(desktopStageDir, '.next'));
copyDirectory(path.join(standaloneDir, 'node_modules'), path.join(desktopStageDir, 'node_modules'));
copyDirectory(path.join(standaloneDir, 'public'), path.join(desktopStageDir, 'public'));
copyDirectory(path.join(standaloneDir, 'prisma'), path.join(desktopStageDir, 'prisma'));
copyFileIfPresent(
  path.join(projectRoot, 'desktop-assets', 'template.db'),
  path.join(desktopStageDir, 'desktop-assets', 'template.db'),
);
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
prunePrismaRuntime(desktopStageDir);
pruneNodeModules(path.join(desktopStageDir, 'node_modules'));
materializeTracedPackage(
  path.join(desktopStageDir, '.next', 'node_modules', 'pino-2e79642258e38174'),
  path.join(projectRoot, 'node_modules', 'pino'),
);
materializeTracedPackage(
  path.join(desktopStageDir, '.next', 'node_modules', 'whatsapp-web.js-d6d5581d72262358'),
  path.join(projectRoot, 'node_modules', 'whatsapp-web.js'),
);
pruneNodeModules(path.join(desktopStageDir, '.next', 'node_modules'));

console.log('Electron bundle prepared successfully.');
