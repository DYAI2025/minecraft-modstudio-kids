import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { rootReducer, INITIAL_STATE, KidAction, AppState, Project } from '@kidmodstudio/core-model';

interface UIState {
  activeId: string | null;
  activeType: 'block' | 'item' | 'recipe' | null;
  isSidebarOpen: boolean;
  voiceState: 'idle' | 'listening' | 'processing';
  transcript: string | null;
}

interface ProjectContextType {
  state: AppState;
  project: Project;
  ui: UIState;
  dispatch: React.Dispatch<KidAction>;
  setSelection: (type: 'block' | 'item' | 'recipe' | null, id: string | null) => void;
  setVoiceState: (status: UIState['voiceState'], transcript?: string | null) => void;
  save: () => Promise<void>;
  load: () => Promise<void>;
  workspaceDir: string | null;
}

import { saveProjectToDisk, loadProjectFromDisk, selectWorkspace } from './persistence';

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(rootReducer, INITIAL_STATE);
  const [workspaceDir, setWorkspaceDir] = React.useState<string | null>(null);
  const [ui, setUi] = React.useState<UIState>({
    activeId: null,
    activeType: null,
    isSidebarOpen: true,
    voiceState: 'idle',
    transcript: null
  });

  const setSelection = (activeType: 'block' | 'item' | 'recipe' | null, activeId: string | null) => {
    setUi(prev => ({ ...prev, activeType, activeId }));
  };

  const setVoiceState = (voiceState: UIState['voiceState'], transcript: string | null = null) => {
    setUi(prev => ({ ...prev, voiceState, transcript: transcript ?? prev.transcript }));
  };

  const save = async () => {
    if (!workspaceDir) {
        alert('No workspace selected.');
        return;
    }
    try {
        await saveProjectToDisk(workspaceDir, state.project);
        console.log('Saved successfully');
    } catch (e: any) {
        alert('Failed to save: ' + e.message);
    }
  };

  const load = async () => {
    const dir = await selectWorkspace();
    if (!dir) return;

    try {
        const project = await loadProjectFromDisk(dir);
        setWorkspaceDir(dir);
        dispatch({ type: 'LOAD_PROJECT', payload: project as any });
    } catch (e: any) {
        alert('Failed to load: ' + e.message);
    }
  };

  return (
    <ProjectContext.Provider value={{ state, project: state.project, dispatch, save, load, workspaceDir, ui, setSelection, setVoiceState }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within ProjectProvider');
  return context;
}
