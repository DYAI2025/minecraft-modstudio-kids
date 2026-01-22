import { app, BrowserWindow, shell, dialog } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc';
import { setupBuildService } from './buildService';
import { setupHelpService } from './helpService';
import * as fs from 'fs';

// Squirrel startup check REMOVED

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const preloadPath = path.join(__dirname, '../preload/bridge.js');
  const indexPath = path.join(__dirname, '../renderer/index.html');
  
  console.log('[Main] Creating Window...');
  console.log('[Main] Preload Path:', preloadPath);
  console.log('[Main] Index Path:', indexPath);

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    titleBarStyle: 'hidden',
  });

  // Load the index.html of the app.
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('[Main] Loading Dev URL:', process.env.VITE_DEV_SERVER_URL);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    console.log('[Main] Loading File:', indexPath);
    mainWindow.loadFile(indexPath).catch(e => {
        console.error('[Main] Failed to load index.html:', e);
        dialog.showErrorBox('Load Error', `Failed to load app entry: ${e.message}\nPath: ${indexPath}`);
    });
  }

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
  });
  
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
      console.error('[Main] did-fail-load:', code, desc);
      dialog.showErrorBox('Load Failure', `Code: ${code}\nDesc: ${desc}`);
  });
}

app.whenReady().then(() => {
  try {
      console.log('[Main] App Ready');
      registerIpcHandlers();
      setupBuildService();
      setupHelpService();
      console.log('[Main] Services Setup Complete');

      createWindow();
    
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      });
  } catch (err: any) {
      console.error('[Main] Fatal Error during setup:', err);
      dialog.showErrorBox('Fatal Setup Error', err.message || String(err));
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
