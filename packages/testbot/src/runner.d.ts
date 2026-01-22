export interface TestRunResult {
    success: boolean;
    logs: string[];
    error?: string;
}
export declare function runTest(projectDir: string, task?: string): Promise<TestRunResult>;
