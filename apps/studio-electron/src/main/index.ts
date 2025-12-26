import { app, BrowserWindow, shell } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc';
import { setupBuildService } from './buildService';
import { setupHelpService } from './helpService';
// import { assertInWorkspacePolicy } from './workspace';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/bridge.js'), // Adjusted for dist structure
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // For now, to allow FS access via main
    },
    titleBarStyle: 'hidden',
  });

  // Load the index.html of the app.
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // assertInWorkspacePolicy removed as undefined
  registerIpcHandlers();
  setupBuildService(); // <--- T2.13 Integration
  setupHelpService();  // <--- T2.14 Integration

  createWindow();

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
