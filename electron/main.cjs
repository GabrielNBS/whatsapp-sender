/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const net = require('net');
const path = require('path');

let mainWindow = null;
let nextServerLoaded = false;
let activePort = null;

function isStagedDesktopBundle() {
  return path.basename(__dirname) !== 'electron';
}

/**
 * When packaged with asar, __dirname points into the virtual asar archive.
 * Native files (.node, .dll, .db) live in the .unpacked sibling directory.
 */
function resolveUnpacked(asarPath) {
  return asarPath.replace(/\.asar([/\\])/i, '.asar.unpacked$1')
                 .replace(/\.asar$/i, '.asar.unpacked');
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
  return directoryPath;
}

function copyFileIfMissing(sourcePath, targetPath) {
  if (fs.existsSync(targetPath)) {
    return;
  }

  ensureDirectory(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function resolveProjectRoot() {
  return isStagedDesktopBundle() ? __dirname : path.resolve(__dirname, '..');
}

function resolveStandaloneDir() {
  return isStagedDesktopBundle()
    ? resolveProjectRoot()
    : path.join(resolveProjectRoot(), '.next', 'standalone');
}

function resolveDesktopAssetsDir() {
  // Desktop assets contain .db files which are unpacked from asar
  return resolveUnpacked(path.join(resolveProjectRoot(), 'desktop-assets'));
}

function findFirstExistingPath(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function resolveInstalledBrowserExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  if (process.platform === 'win32') {
    const programFiles = process.env.PROGRAMFILES;
    const programFilesX86 = process.env['PROGRAMFILES(X86)'];
    const localAppData = process.env.LOCALAPPDATA;

    return findFirstExistingPath([
      programFiles && path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      programFilesX86 && path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      localAppData && path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      programFiles && path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      programFilesX86 && path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      localAppData && path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ]);
  }

  if (process.platform === 'darwin') {
    return findFirstExistingPath([
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ]);
  }

  return findFirstExistingPath([
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/microsoft-edge',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
  ]);
}

function toDatabaseUrl(filePath) {
  return `file:${filePath.replace(/\\/g, '/')}`;
}

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Unable to reserve a local port.')));
        return;
      }

      const port = address.port;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
    server.on('error', reject);
  });
}

function waitForPort(port, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attemptConnection = () => {
      const socket = net.createConnection({ host: '127.0.0.1', port }, () => {
        socket.end();
        resolve();
      });

      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error('Timed out waiting for the desktop server to start.'));
          return;
        }

        setTimeout(attemptConnection, 250);
      });
    };

    attemptConnection();
  });
}

async function startNextServer() {
  if (nextServerLoaded) {
    return activePort;
  }

  const standaloneDir = resolveStandaloneDir();
  const serverPath = path.join(standaloneDir, 'server.js');
  if (!fs.existsSync(serverPath)) {
    throw new Error(
      'Standalone build not found. Run "npm run desktop:prepare-bundle" before opening the desktop app.',
    );
  }

  const desktopAssetsDir = resolveDesktopAssetsDir();
  const templateDatabasePath = path.join(desktopAssetsDir, 'template.db');
  if (!fs.existsSync(templateDatabasePath)) {
    throw new Error(
      'Template database not found. Run "npm run desktop:prepare-db" before packaging the app.',
    );
  }

  const runtimeRoot = ensureDirectory(path.join(app.getPath('userData'), 'runtime'));
  const dataDirectory = ensureDirectory(path.join(runtimeRoot, 'data'));
  ensureDirectory(path.join(runtimeRoot, 'whatsapp-auth'));

  const databasePath = path.join(dataDirectory, 'app.db');
  copyFileIfMissing(templateDatabasePath, databasePath);

  const browserExecutable = resolveInstalledBrowserExecutable();
  if (!browserExecutable) {
    throw new Error(
      'Nenhum navegador compatível foi encontrado. Instale Google Chrome ou Microsoft Edge nesta máquina para usar o WhatsApp Sender.',
    );
  }

  activePort = await reservePort();
  process.env.NODE_ENV = 'production';
  process.env.PORT = String(activePort);
  process.env.HOSTNAME = '127.0.0.1';
  process.env.APP_RUNTIME_DIR = runtimeRoot;
  process.env.APP_DESKTOP_ASSETS_DIR = desktopAssetsDir;
  process.env.APP_DATABASE_FILENAME = 'app.db';
  process.env.DATABASE_URL = toDatabaseUrl(databasePath);
  process.env.PUPPETEER_EXECUTABLE_PATH = browserExecutable;

  // chdir needs a real filesystem path, not inside .asar
  process.chdir(resolveUnpacked(standaloneDir));
  require(serverPath);
  await waitForPort(activePort);
  nextServerLoaded = true;

  return activePort;
}

async function createMainWindow() {
  const port = await startNextServer();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1180,
    minHeight: 760,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}`);
}

app.whenReady().then(async () => {
  try {
    await createMainWindow();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    dialog.showErrorBox('Falha ao iniciar o WhatsApp Sender', message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createMainWindow();
  }
});
