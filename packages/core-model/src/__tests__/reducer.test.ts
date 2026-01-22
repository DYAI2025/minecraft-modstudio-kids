import { describe, it, expect } from 'vitest';
import { rootReducer, INITIAL_STATE } from '../reducer';
import { Block, Item } from '../schema';
import { KidAction } from '../actions';

describe('Reducer Logic', () => {
    it('should create a block', () => {
        const newBlock: Block = {
            id: 'ruby_ore',
            name: 'Ruby Ore',
            type: 'block',
            properties: { hardness: 3, luminance: 0, transparent: false },
            texture: { type: 'procedural', value: 'rock' }
        };

        const action: KidAction = { type: 'CREATE_BLOCK', payload: newBlock };
        const newState = rootReducer(INITIAL_STATE, action);

        expect(newState.project.blocks['ruby_ore']).toEqual(newBlock);
        expect(newState.history.past.length).toBe(1);
    });

    it('should updated meta', () => {
        const action: KidAction = { type: 'UPDATE_META', payload: { name: 'Super Mod' } };
        const newState = rootReducer(INITIAL_STATE, action);
        expect(newState.project.meta.name).toBe('Super Mod');
    });

    it('should ignore updates to non-existent items', () => {
        const action: KidAction = { type: 'UPDATE_ITEM', payload: { id: 'ghost', update: { name: 'Boo' } } };
        const newState = rootReducer(INITIAL_STATE, action);
        expect(newState).toBe(INITIAL_STATE);
    });
});

describe('Undo / Redo', () => {
    it('should undo and redo a meta change', () => {
        // 1. Initial
        const state0 = INITIAL_STATE;
        expect(state0.project.meta.name).toBe('Untitled Mod');

        // 2. Change Name
        const action1: KidAction = { type: 'UPDATE_META', payload: { name: 'Step 1' } };
        const state1 = rootReducer(state0, action1);
        expect(state1.project.meta.name).toBe('Step 1');
        expect(state1.history.past.length).toBe(1);

        // 3. Change Name again
        const action2: KidAction = { type: 'UPDATE_META', payload: { name: 'Step 2' } };
        const state2 = rootReducer(state1, action2);
        expect(state2.project.meta.name).toBe('Step 2');
        expect(state2.history.past.length).toBe(2);

        // 4. Undo -> Should be 'Step 1'
        const stateUndo1 = rootReducer(state2, { type: 'UNDO' });
        expect(stateUndo1.project.meta.name).toBe('Step 1');
        expect(stateUndo1.history.future.length).toBe(1);

        // 5. Undo -> Should be 'Untitled Mod'
        const stateUndo2 = rootReducer(stateUndo1, { type: 'UNDO' });
        expect(stateUndo2.project.meta.name).toBe('Untitled Mod');
        expect(stateUndo2.history.future.length).toBe(2);

        // 6. Redo -> Should be 'Step 1'
        const stateRedo1 = rootReducer(stateUndo2, { type: 'REDO' });
        expect(stateRedo1.project.meta.name).toBe('Step 1');

        // 7. Redo -> Should be 'Step 2'
        const stateRedo2 = rootReducer(stateRedo1, { type: 'REDO' });
        expect(stateRedo2.project.meta.name).toBe('Step 2');
    });

    it('should cap history at 10', () => {
        let state = INITIAL_STATE;
        for (let i = 0; i < 15; i++) {
             state = rootReducer(state, { type: 'UPDATE_META', payload: { name: `Update ${i}` } });
        }
        expect(state.history.past.length).toBe(10);
        expect(state.project.meta.name).toBe('Update 14');
        // Oldest in past should not be initial state anymore
        // Past[0] is correct
    });
});
