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
  return path.join(resolveProjectRoot(), 'desktop-assets');
}

function collectFiles(directoryPath, fileName, matches = []) {
  if (!fs.existsSync(directoryPath)) {
    return matches;
  }

  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      collectFiles(entryPath, fileName, matches);
    } else if (entry.name.toLowerCase() === fileName.toLowerCase()) {
      matches.push(entryPath);
    }
  }

  return matches;
}

function resolveBundledChromeExecutable(desktopAssetsDir) {
  const chromeRoot = path.join(desktopAssetsDir, 'chrome');
  if (!fs.existsSync(chromeRoot)) {
    return null;
  }

  if (process.platform === 'win32') {
    return collectFiles(chromeRoot, 'chrome.exe')[0] ?? null;
  }

  if (process.platform === 'darwin') {
    return collectFiles(chromeRoot, 'Chromium')[0]
      ?? collectFiles(chromeRoot, 'Google Chrome for Testing')[0]
      ?? null;
  }

  return collectFiles(chromeRoot, 'chrome')[0] ?? null;
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

  const bundledChromeExecutable = resolveBundledChromeExecutable(desktopAssetsDir);

  activePort = await reservePort();
  process.env.NODE_ENV = 'production';
  process.env.PORT = String(activePort);
  process.env.HOSTNAME = '127.0.0.1';
  process.env.APP_RUNTIME_DIR = runtimeRoot;
  process.env.APP_DESKTOP_ASSETS_DIR = desktopAssetsDir;
  process.env.APP_DATABASE_FILENAME = 'app.db';
  process.env.DATABASE_URL = toDatabaseUrl(databasePath);
  if (bundledChromeExecutable) {
    process.env.PUPPETEER_EXECUTABLE_PATH = bundledChromeExecutable;
  }

  process.chdir(standaloneDir);
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
