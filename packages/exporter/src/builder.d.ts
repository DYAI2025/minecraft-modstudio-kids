export interface BuildResult {
    success: boolean;
    jarPath?: string;
    logs: string[];
    error?: string;
}
export declare function runBuild(projectDir: string): Promise<BuildResult>;
