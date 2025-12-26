import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

export interface BuildResult {
    success: boolean;
    jarPath?: string;
    logs: string[];
    error?: string;
}

export async function runBuild(projectDir: string): Promise<BuildResult> {
    const logs: string[] = [];
    
    // 1. Determine Build Command
    // Prefer ./gradlew if it exists, otherwise gradle
    let cmd = 'gradle';
    const isWin = os.platform() === 'win32';
    const wrapperName = isWin ? 'gradlew.bat' : 'gradlew';
    const wrapperPath = path.join(projectDir, wrapperName);
    
    // Check if wrapper exists
    let useWrapper = false;
    try {
        await fs.access(wrapperPath);
        useWrapper = true;
    } catch {}

    const args = ['build'];
    
    if (useWrapper) {
        cmd = wrapperPath;
        if (!isWin) {
            // Ensure executable
            try {
                await fs.chmod(wrapperPath, '755');
            } catch (e) {
                 logs.push(`Warning: Could not chmod gradlew: ${e}`);
            }
        }
    } else {
        // Fallback checks?
    }

    logs.push(`Starting build in ${projectDir} using ${cmd}`);

    return new Promise<BuildResult>((resolve) => {
        const child = spawn(cmd, args, {
            cwd: projectDir,
            shell: true, // Use shell to resolve 'gradle' in path if needed
            env: process.env // Inherit env (JAVA_HOME etc)
        });

        child.stdout.on('data', (data) => {
            const line = data.toString().trim();
            if (line) logs.push(line);
        });

        child.stderr.on('data', (data) => {
            const line = data.toString().trim();
            if (line) logs.push(`[ERR] ${line}`);
        });

        child.on('error', (err) => {
            logs.push(`Spawn Error: ${err.message}`);
            resolve({
                success: false,
                logs,
                error: `Failed to start build process: ${err.message}`
            });
        });

        child.on('close', async (code) => {
            if (code === 0) {
                // Happy path: Find the jar
                const libsDir = path.join(projectDir, 'build', 'libs');
                try {
                    const files = await fs.readdir(libsDir);
                    // Filter for the main jar. Usually valid one doesn't have -sources or -dev
                    // Pattern: ${modid}-${version}.jar
                    // We might just pick the first one that doesn't end in -sources.jar or -dev.jar
                    // Or Fabric default is just one jar often?
                    
                    const jarFile = files.find(f => f.endsWith('.jar') && !f.endsWith('-sources.jar') && !f.endsWith('-dev.jar'));
                    
                    if (jarFile) {
                        resolve({
                            success: true,
                            logs,
                            jarPath: path.join(libsDir, jarFile)
                        });
                        return;
                    }
                } catch (e) {
                    logs.push(`Error finding artifacts: ${e}`);
                }
                
                resolve({
                    success: true,
                    logs,
                    error: "Build succeeded but JAR artifact not found."
                });
            } else {
                resolve({
                    success: false,
                    logs,
                    error: `Build failed with exit code ${code}`
                });
            }
        });
    });
}
