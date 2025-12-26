import { Project } from '@kidmodstudio/core-model';

// Mock for Browser Testing
const mockBridge = {
  saveProject: async (_dir: string, _proj: Project) => ({ success: true }),
  loadProject: async (_dir: string) => ({ 
    success: true, 
    data: { 
        meta: { modId: 'browser_test', name: 'Browser Test', version: '1.0' }, 
        blocks: {}, items: {}, recipes: {} 
    } 
  }),
  selectWorkspaceDir: async () => '/mock/workspace'
};

const bridge = window.KidMod || mockBridge;

export async function saveProjectToDisk(dir: string, project: Project): Promise<void> {
  // @ts-ignore
  const result = await bridge.saveProject(dir, project);
  if (!result.success) {
    throw new Error(result.error || 'Unknown save error');
  }
}

export async function loadProjectFromDisk(dir: string): Promise<Project> {
  // @ts-ignore
  const result = await bridge.loadProject(dir);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Unknown load error');
  }
  return result.data as Project;
}

export async function selectWorkspace(): Promise<string | null> {
  // @ts-ignore
  return bridge.selectWorkspaceDir();
}
