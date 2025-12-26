import { describe, it, expect } from 'vitest';
import { explainLastAction, explainAction } from '../explain';
import { INITIAL_STATE } from '../reducer';

describe('explain logic', () => {
    it('should explain empty state', () => {
        const text = explainLastAction(INITIAL_STATE);
        expect(text).toBe("Noch nichts passiert. Leg los!");
    });

    it('should explain create block', () => {
        const action: any = {
            type: 'CREATE_BLOCK',
            payload: { id: 'b1', name: 'TestBlock', type: 'block' }
        };
        const text = explainAction(action);
        expect(text).toBe('Du hast einen neuen Block namens "TestBlock" erstellt.');
    });

    it('should explain load project', () => {
        const action: any = {
            type: 'LOAD_PROJECT',
            payload: {
                meta: { name: 'My Mod' },
                blocks: {}, items: {}, recipes: {}
            }
        };
        const text = explainAction(action);
        expect(text).toBe('Das Projekt "My Mod" wurde geladen.');
    });
});
