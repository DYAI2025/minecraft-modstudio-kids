import { describe, it, expect, vi, afterEach } from 'vitest';
import { LogAnalyzer } from '../analyzer';
import { runTest } from '../runner';
import EventEmitter from 'events';

// Mock child_process and fs module
vi.mock('child_process', () => ({
    spawn: vi.fn()
}));
vi.mock('fs/promises', () => ({
    access: vi.fn(),
}));

import { spawn } from 'child_process';
import * as fs from 'fs/promises';

describe('Testbot', () => {
    
    describe('LogAnalyzer', () => {
        it('should detect success', () => {
            const analyzer = new LogAnalyzer();
            analyzer.processLine('[10:00:00] [Server user/INFO]: Done (5.0s)! For help, type "help"');
            expect(analyzer.state.status).toBe('success');
        });

        it('should detect crash', () => {
            const analyzer = new LogAnalyzer();
            analyzer.processLine('Exception in thread "main" java.lang.RuntimeException');
            expect(analyzer.state.status).toBe('crashed');
            expect(analyzer.state.crashReason).toContain('Exception');
        });
    });

    describe('Runner', () => {
        afterEach(() => {
            vi.clearAllMocks();
        });

        it('should run successfully when log success detected', async () => {
             const mockChild = new EventEmitter() as any;
             mockChild.stdout = new EventEmitter();
             mockChild.stderr = new EventEmitter();
             mockChild.kill = vi.fn();
             
             vi.mocked(spawn).mockReturnValue(mockChild);

             const promise = runTest('/tmp/test');
             
             // Emit success log
             setTimeout(() => {
                 mockChild.stdout.emit('data', 'Done (1s)! For help, type');
             }, 10);

             const result = await promise;
             expect(result.success).toBe(true);
             expect(mockChild.kill).toHaveBeenCalled();
        });

        it('should fail when log crash detected', async () => {
            const mockChild = new EventEmitter() as any;
            mockChild.stdout = new EventEmitter();
            mockChild.stderr = new EventEmitter();
            mockChild.kill = vi.fn();
            
            vi.mocked(spawn).mockReturnValue(mockChild);

            const promise = runTest('/tmp/test');
            
            // Emit crash log
            setTimeout(() => {
                mockChild.stderr.emit('data', 'Exception in thread main');
            }, 10);

            const result = await promise;
            expect(result.success).toBe(false);
            expect(result.error).toBeTruthy();
       });
    });
});
