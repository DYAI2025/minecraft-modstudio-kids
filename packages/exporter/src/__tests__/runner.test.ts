import { describe, it, expect, vi, afterEach } from 'vitest';
import { runBuild } from '../builder';
import * as path from 'path';
import * as fs from 'fs/promises';
import { EventEmitter } from 'events';

// Mock child_process.spawn
const mockSpawn = vi.fn();
vi.mock('child_process', () => ({
    spawn: (...args: any[]) => mockSpawn(...args)
}));

// Mock fs
vi.mock('fs/promises', async () => {
    const actual = await vi.importActual<typeof import('fs/promises')>('fs/promises');
    return {
        ...actual,
        access: vi.fn(),
        chmod: vi.fn(),
        readdir: vi.fn()
    };
});

describe('Build Runner', () => {

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should execute gradle and return success on exit code 0', async () => {
        // Mock fs checks
        vi.mocked(fs.access).mockResolvedValue(undefined); // wrapper exists
        vi.mocked(fs.readdir).mockResolvedValue(['testmod-1.0.0.jar'] as any);

        // Mock Spawn Process
        const mockChild = new EventEmitter() as any;
        mockChild.stdout = new EventEmitter();
        mockChild.stderr = new EventEmitter();
        
        mockSpawn.mockReturnValue(mockChild);

        const buildPromise = runBuild('/tmp/testproject');

        // Simulate process behavior
        setTimeout(() => {
            mockChild.stdout.emit('data', 'Building...');
            mockChild.emit('close', 0);
        }, 10);

        const result = await buildPromise;

        expect(result.success).toBe(true);
        expect(result.jarPath).toContain('testmod-1.0.0.jar');
        expect(mockSpawn).toHaveBeenCalled();
        // Check first arg of spawn was likely absolute path to gradlew or simple gradlew
        const cmd = mockSpawn.mock.calls[0][0];
        expect(cmd).toContain('gradlew');
    });

    it('should return failure on non-zero exit code', async () => {
        vi.mocked(fs.access).mockRejectedValue(new Error('No wrapper')); // No wrapper, fallback to gradle

        const mockChild = new EventEmitter() as any;
        mockChild.stdout = new EventEmitter();
        mockChild.stderr = new EventEmitter();
        mockSpawn.mockReturnValue(mockChild);

        const buildPromise = runBuild('/tmp/testproject');

        setTimeout(() => {
             mockChild.stderr.emit('data', 'Compilation failed');
             mockChild.emit('close', 1);
        }, 10);

        const result = await buildPromise;

        expect(result.success).toBe(false);
        expect(result.error).toContain('code 1');
        expect(result.logs.join('')).toContain('Compilation failed');
        
        // Verify fallback command
        expect(mockSpawn).toHaveBeenCalledWith('gradle', expect.any(Array), expect.any(Object));
    });
});
