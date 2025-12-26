import { ipcMain, dialog } from 'electron';

export function registerIpcHandlers() {
  ipcMain.handle('dialog:selectWorkspace', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('project:load', async (_, dir) => {
    // Stub
    console.log('Loading project from:', dir);
    return { success: false, error: 'Not implemented' };
  });

  ipcMain.handle('project:save', async (_, dir, json) => {
    console.log('Saving project to:', dir);
    return { success: true };
  });

  // Ops Stubs
  ipcMain.handle('ops:export', async () => ({ success: true, jarPath: '/tmp/dummy.jar' }));
  ipcMain.handle('ops:build', async () => ({ success: true, logs: 'Build started...' }));
  ipcMain.handle('ops:test', async () => ({ success: true, report: 'All good' }));

  // AI Stubs
  ipcMain.handle('ai:queryDocs', async (_, q) => ({ answer: 'Docs offline', sources: [] }));
  ipcMain.handle('ai:suggest', async () => ({ actions: [], explanation: 'AI disabled' }));
}
