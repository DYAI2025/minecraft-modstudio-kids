import { describe, it, expect } from 'vitest';
import { validateProject } from '../validate';
import { Project } from '../schema';

describe('Project Schema Validation', () => {
  it('should validate a valid minimal project', () => {
    const validProject: Project = {
      meta: {
        modId: 'my_mod',
        name: 'My Mod',
        version: '1.0.0'
      },
      blocks: {},
      items: {},
      recipes: {
        'my_recipe': {
            id: 'my_recipe',
            type: 'crafting_shaped',
            pattern: ['AAA', ' A ', ' A '],
            key: { 'A': 'minecraft:dirt' },
            result: { item: 'minecraft:diamond', count: 1 }
        }
      }
    };

    const result = validateProject(validProject);
    expect(result.success).toBe(true);
  });

  it('should fail on invalid modId', () => {
    const invalidProject = {
      meta: {
        modId: 'My Mod', // spaces/caps not allowed
        name: 'My Mod'
      },
      blocks: {},
      items: {},
      recipes: {}
    };

    const result = validateProject(invalidProject);
    expect(result.success).toBe(false);
    if (!result.success) {
        expect(result.errors[0]).toContain('lower_snake_case');
    }
  });

  it('should fail on missing recipe references', () => {
    const invalidProject: Project = {
      meta: { modId: 'test', name: 'Test', version: '0.0.1' },
      blocks: {},
      items: {},
      recipes: {
        'bad_recipe': {
            id: 'bad_recipe',
            type: 'crafting_shaped',
            pattern: ['AAA', 'AAA', 'AAA'],
            key: { 'A': 'unknown_item' }, // Not in items/blocks and not starting with minecraft:
            result: { item: 'minecraft:dirt', count: 1 }
        }
      }
    };

    const result = validateProject(invalidProject);
    expect(result.success).toBe(false);
    if (!result.success) {
        expect(result.errors[0]).toContain('references unknown item');
    }
  });
});
