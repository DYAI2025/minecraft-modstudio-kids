export interface PipelineStatus {
  step: 'export' | 'build' | 'test' | 'done' | 'error';
  message: string;
  details?: string;
  progress?: number;
}

export interface KidModBridge {
  // Workspace / FS
  selectWorkspaceDir: () => Promise<string | null>;
  loadProject: (projectDir: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  saveProject: (projectDir: string, projectJson: any) => Promise<{ success: boolean; error?: string }>;

  // Build & Operations
  runExport: (projectDir: string) => Promise<{ success: boolean; jarPath?: string; error?: string }>;
  runBuild: (projectDir: string) => Promise<{ success: boolean; logs: string; error?: string }>;
  runTest: (projectDir: string) => Promise<{ success: boolean; report: string; error?: string }>;

  startBuildPipeline: (project: any) => Promise<void>;
  onBuildProgress: (callback: (event: any, status: PipelineStatus) => void) => () => void;
  searchHelp: (query: string) => Promise<{ title: string; excerpt: string; fullContent: string }[]>;

  // AI & Help
  queryDocs: (query: string) => Promise<{ answer: string; sources: string[] }>;
  llmSuggest: (prompt: string, context: any) => Promise<{ actions?: any[]; explanation?: string; error?: string }>;
}

declare global {
  interface Window {
    KidMod: KidModBridge;
  }
}
