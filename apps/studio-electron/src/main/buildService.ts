import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { exportProject, runBuild } from '@kidmodstudio/exporter';
import { runTest } from '@kidmodstudio/testbot';

export function setupBuildService() {
    ipcMain.handle('pipeline:start', async (event, project: any) => {
        const sender = event.sender;
        
        const sendProgress = (status: { step: string, message: string, progress?: number, details?: string }) => {
            sender.send('pipeline:progress', status);
        };

        try {
            // 1. Export Step
            sendProgress({ step: 'export', message: 'Wir schreiben das Rezept für deinen Mod...', progress: 10 });
            
            // Create temp dir
            const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kidmod-build-'));
            console.log('Build working directory:', tempDir);
            
            await exportProject({
                outputDir: tempDir,
                project: project
            });
            
            sendProgress({ step: 'build', message: 'Rezept fertig! Jetzt wird gebaut...', progress: 30 });

            // 2. Build Step
            // Use runBuild from exporter
            // Note: This might fail on user machine if no valid Java/Gradle
            const buildResult = await runBuild(tempDir);
            
            if (!buildResult.success) {
                // Log build errors
                console.error('Build failed:', buildResult.error);
                sendProgress({ 
                    step: 'error', 
                    message: 'Oje! Beim Bauen hat etwas nicht geklappt.', 
                    details: buildResult.error || buildResult.logs.join('\n')
                });
                return;
            }
            
            sendProgress({ step: 'test', message: 'Mod gebaut! Wir starten Minecraft kurz Probe...', progress: 70 });

            // 3. Test Step
            // Use runTest from testbot
            // This checks log output for success or "Crash"
            const testResult = await runTest(tempDir, 'runServer'); // Headless server test

            if (!testResult.success) {
                 sendProgress({
                    step: 'error',
                    message: 'Der Mod startet nicht richtig.',
                    details: testResult.error || testResult.logs.join('\n')
                 });
                 return;
            }

            // 4. Success
            sendProgress({ step: 'done', message: 'Juhu! Alles funktioniert!', progress: 100 });

        } catch (error: any) {
            console.error('Pipeline error:', error);
            sendProgress({ step: 'error', message: 'Ein unerwarteter Fehler ist aufgetreten.', details: error.toString() });
        }
    });
}
