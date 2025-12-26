import { describe, it, expect } from 'vitest';
import { assertInWorkspace, safeJoin } from '../workspace.js';
import path from 'path';

describe('Workspace Sandbox', () => {
    // Mock root
    const root = path.resolve('/tmp/kidmod');

    it('should allow paths inside workspace', () => {
        expect(() => assertInWorkspace(root, 'project.json')).not.toThrow();
        expect(() => assertInWorkspace(root, 'assets/texture.png')).not.toThrow();
    });

    it('should block paths using .. to go out', () => {
        expect(() => assertInWorkspace(root, '../evil.sh')).toThrow(/Security Violation/);
        expect(() => assertInWorkspace(root, 'assets/../../evil.sh')).toThrow(/Security Violation/);
    });

    it('should block absolute paths outside root', () => {
        expect(() => assertInWorkspace(root, '/etc/passwd')).toThrow(/Security Violation/);
    });
    
    it('safeJoin should return resolved path if safe', () => {
        const p = safeJoin(root, 'src', 'main.java');
        expect(p).toBe(path.join(root, 'src', 'main.java'));
    });

    it('safeJoin should throw if unsafe', () => {
        expect(() => safeJoin(root, '../foo')).toThrow();
    });
});
