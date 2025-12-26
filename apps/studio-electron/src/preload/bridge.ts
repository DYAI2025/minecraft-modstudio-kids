import { contextBridge, ipcRenderer } from 'electron';

// Explicitly whitelist channels to prevent arbitrary IPC
const VALID_CHANNELS = [
  'dialog:selectWorkspace',
  'project:load',
  'project:save',
  'ops:export',
  'ops:build',
  'ops:test',
  'ai:queryDocs',
  'ai:suggest',
] as const;

contextBridge.exposeInMainWorld('KidMod', {
  selectWorkspaceDir: () => ipcRenderer.invoke('dialog:selectWorkspace'),
  loadProject: (dir: string) => ipcRenderer.invoke('project:load', dir),
  saveProject: (dir: string, json: any) => ipcRenderer.invoke('project:save', dir, json),
  
  runExport: (dir: string) => ipcRenderer.invoke('ops:export', dir),
  runBuild: (dir: string) => ipcRenderer.invoke('ops:build', dir),
  runTest: (dir: string) => ipcRenderer.invoke('ops:test', dir),
  
  // New Orchestration API
  startBuildPipeline: (project: any) => ipcRenderer.invoke('pipeline:start', project),
  onBuildProgress: (callback: (event: any, status: any) => void) => {
    ipcRenderer.on('pipeline:progress', callback);
    return () => ipcRenderer.removeListener('pipeline:progress', callback);
  },
  searchHelp: (query: string) => ipcRenderer.invoke('help:search', query),

  queryDocs: (query: string) => ipcRenderer.invoke('ai:queryDocs', query),
  llmSuggest: (prompt: string, context: any) => ipcRenderer.invoke('ai:suggest', prompt, context),
});
