import { describe, it, expect, afterEach } from 'vitest';
import { exportProject } from '../index';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Project } from '@kidmodstudio/core-model';

const TEST_DIR = path.resolve(__dirname, '../../test_output_full');

describe('Full Exporter', () => {
    afterEach(async () => {
        try {
            await fs.rm(TEST_DIR, { recursive: true, force: true });
        } catch {}
    });

    it('should generate java and json resources', async () => {
        const mockProject: Project = {
            meta: { modId: 'testmod', name: 'Test Mod', version: '1.0.0' },
            blocks: {
                'magma_block': {
                    id: 'magma_block',
                    name: 'Magma',
                    type: 'block',
                    properties: { hardness: 1.0, luminance: 0, transparent: false },
                    texture: { type: 'procedural', value: 'rock' }
                }
            },
            items: {
                'ruby_gem': {
                    id: 'ruby_gem',
                    name: 'Ruby',
                    type: 'item',
                    itemType: 'gem',
                    properties: { maxStackSize: 64 },
                    texture: { type: 'procedural', value: 'gem' }
                }
            },
            recipes: {}
        };

        await exportProject({
            outputDir: TEST_DIR,
            project: mockProject
        });

        // 1. Check ModRegistry.java
        const registry = await fs.readFile(path.join(TEST_DIR, 'src/main/java/com/example/ModRegistry.java'), 'utf-8');
        expect(registry).toContain('public static final Block MAGMA_BLOCK = registerBlock("magma_block"');
        expect(registry).toContain('public static final Item RUBY_GEM = registerItem("ruby_gem"');

        // 2. Check JSONs
        const lang = await fs.readFile(path.join(TEST_DIR, 'src/main/resources/assets/testmod/lang/en_us.json'), 'utf-8');
        expect(lang).toContain('"block.testmod.magma_block": "Magma"');

        const blockState = await fs.readFile(path.join(TEST_DIR, 'src/main/resources/assets/testmod/blockstates/magma_block.json'), 'utf-8');
        expect(blockState).toContain('"model": "testmod:block/magma_block"');
    });
});
