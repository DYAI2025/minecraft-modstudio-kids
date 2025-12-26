import { describe, it, expect } from 'vitest';
import { CommandParser } from '../parser';

describe('CommandParser', () => {
    
    it('should parse "erstelle einen block namens Magma"', () => {
        const result = CommandParser.parse('erstelle einen block namens Magma');
        expect(result.action).not.toBeNull();
        expect(result.action?.type).toBe('CREATE_BLOCK');
        
        if (result.action?.type === 'CREATE_BLOCK') {
            expect(result.action.payload.name).toBe('Magma');
            expect(result.action.payload.type).toBe('block');
        }
    });

    it('should parse "neuer block Stein"', () => {
        const result = CommandParser.parse('neuer block Stein');
        expect(result.action?.type).toBe('CREATE_BLOCK');
        
        if (result.action?.type === 'CREATE_BLOCK') {
            expect(result.action.payload.name).toBe('Stein');
        }
    });

    it('should parse "erstelle ein item namens Rubin"', () => {
        const result = CommandParser.parse('erstelle ein item namens Rubin');
        expect(result.action?.type).toBe('CREATE_ITEM');
        
        if (result.action?.type === 'CREATE_ITEM') {
            expect(result.action.payload.name).toBe('Rubin');
            expect(result.action.payload.type).toBe('item');
            expect(result.action.payload.itemType).toBe('gem');
        }
    });

    it('should return null for unknown commands', () => {
        const result = CommandParser.parse('fliege zum mond');
        expect(result.action).toBeNull();
    });
});
