import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { LogAnalyzer, LogAnalysis } from './analyzer';

export interface TestRunResult {
    success: boolean;
    logs: string[];
    error?: string;
}

export async function runTest(projectDir: string, task = 'runServer'): Promise<TestRunResult> {
    const analyzer = new LogAnalyzer();
    const logs: string[] = [];

    // Wrappper detection (Reused logic from Exporter/Builder - maybe move to shared tools later)
    const isWin = os.platform() === 'win32';
    const wrapperName = isWin ? 'gradlew.bat' : 'gradlew';
    const wrapperPath = path.join(projectDir, wrapperName);
    let cmd = 'gradle';
    let useWrapper = false;

    try {
        await fs.access(wrapperPath);
        useWrapper = true;
        cmd = wrapperPath;
    } catch {}

    const child = spawn(cmd, [task], {
        cwd: projectDir,
        shell: true,
        env: process.env
    });

    return new Promise((resolve) => {
        let isResolved = false;
        
        // Timeout safety (3 mins)
        const timeout = setTimeout(() => {
            if (!isResolved) {
                child.kill();
                resolve({
                    success: false,
                    logs,
                    error: "Timeout waiting for server start"
                });
                isResolved = true;
            }
        }, 180000);

        const handleLog = (data: any) => {
            const lines = data.toString().split(/\r?\n/);
            for (const line of lines) {
                if (!line.trim()) continue;
                logs.push(line);
                
                const analysis = analyzer.processLine(line);
                if (analysis.status === 'success') {
                    if (!isResolved) {
                        isResolved = true;
                        clearTimeout(timeout);
                        child.kill(); // Kill successfully started server
                        resolve({ success: true, logs });
                    }
                } else if (analysis.status === 'crashed') {
                    if (!isResolved) {
                        isResolved = true;
                        clearTimeout(timeout);
                        child.kill();
                        resolve({ success: false, logs, error: analysis.crashReason });
                    }
                }
            }
        };

        child.stdout.on('data', handleLog);
        child.stderr.on('data', handleLog);
        
        child.on('error', (err) => {
             if (!isResolved) {
                resolve({ success: false, logs, error: err.message });
                isResolved = true;
             }
        });

        child.on('close', (code) => {
            if (!isResolved) {
                clearTimeout(timeout);
                // If closed without success/crash detection, check exit code
                if (code === 0) {
                     // Maybe it finished?
                     resolve({ success: true, logs });
                } else {
                     resolve({ success: false, logs, error: `Process exited with code ${code}` });
                }
                isResolved = true;
            }
        });
    });
}
