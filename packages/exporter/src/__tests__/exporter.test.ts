import { describe, it, expect, afterEach } from 'vitest';
import { scaffoldTemplate } from '../index';
import * as fs from 'fs/promises';
import * as path from 'path';

const TEST_DIR = path.resolve(__dirname, '../../test_output');

describe('Exporter Scaffolding', () => {
    // Clean up
    afterEach(async () => {
        try {
            await fs.rm(TEST_DIR, { recursive: true, force: true });
        } catch {}
    });

    it('should scaffold template files', async () => {
        await scaffoldTemplate({
            outputDir: TEST_DIR,
            modId: 'testmod',
            modName: 'Test Mod',
            description: 'A test'
        });

        // Check key files
        const buildGradle = await fs.readFile(path.join(TEST_DIR, 'build.gradle'), 'utf-8');
        expect(buildGradle).toBeTruthy();

        const fabricMod = await fs.readFile(path.join(TEST_DIR, 'src/main/resources/fabric.mod.json'), 'utf-8');
        expect(fabricMod).toContain('"id": "testmod"');
        expect(fabricMod).toContain('"name": "Test Mod"');
        
        const mainClass = await fs.readFile(path.join(TEST_DIR, 'src/main/java/com/example/TemplateMod.java'), 'utf-8');
        expect(mainClass).toContain('String MOD_ID = "testmod"');

        // Check mixin rename
        const mixinExists = await fs.stat(path.join(TEST_DIR, 'src/main/resources/testmod.mixins.json')).catch(() => false);
        expect(mixinExists).toBeTruthy();
    });
});
