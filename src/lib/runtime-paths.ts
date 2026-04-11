import { mkdirSync } from 'fs';
import path from 'path';

export interface RuntimePaths {
  appRuntimeDir: string;
  dataDir: string;
  databasePath: string;
  authDir: string;
  desktopAssetsDir: string | null;
}

const DEFAULT_RUNTIME_FOLDER = 'runtime';

function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function ensureDirectory(directoryPath: string): string {
  mkdirSync(directoryPath, { recursive: true });
  return directoryPath;
}

function resolveDesktopAssetsDir(): string | null {
  const configuredDirectory = process.env.APP_DESKTOP_ASSETS_DIR;
  if (!configuredDirectory) {
    return null;
  }

  return path.resolve(configuredDirectory);
}

export function resolveRuntimePaths(): RuntimePaths {
  const configuredRuntimeDir = process.env.APP_RUNTIME_DIR;
  const appRuntimeDir = configuredRuntimeDir
    ? path.resolve(configuredRuntimeDir)
    : path.resolve(DEFAULT_RUNTIME_FOLDER);
  const dataDir = path.join(appRuntimeDir, 'data');
  const databaseFileName = process.env.APP_DATABASE_FILENAME || 'app.db';

  return {
    appRuntimeDir,
    dataDir,
    databasePath: path.join(dataDir, databaseFileName),
    authDir: path.join(appRuntimeDir, 'whatsapp-auth'),
    desktopAssetsDir: resolveDesktopAssetsDir(),
  };
}

export function ensureRuntimeEnvironment(): RuntimePaths {
  const runtimePaths = resolveRuntimePaths();

  ensureDirectory(runtimePaths.appRuntimeDir);
  ensureDirectory(runtimePaths.dataDir);
  ensureDirectory(runtimePaths.authDir);

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `file:${toPosixPath(runtimePaths.databasePath)}`;
  }

  if (!process.env.WWEBJS_AUTH_PATH) {
    process.env.WWEBJS_AUTH_PATH = runtimePaths.authDir;
  }

  return runtimePaths;
}
