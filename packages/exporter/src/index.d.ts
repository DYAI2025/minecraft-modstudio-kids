import { Project } from '@kidmodstudio/core-model';
import { runBuild, BuildResult } from './builder';
export { runBuild, BuildResult };
export interface ExportOptions {
    outputDir: string;
    project: Project;
}
export declare function exportProject(options: ExportOptions): Promise<void>;
export declare function scaffoldTemplate(options: {
    outputDir: string;
    modId: string;
    modName: string;
    description?: string;
}): Promise<void>;
