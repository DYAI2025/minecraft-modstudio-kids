import { Dispatch } from 'react';
import { KidAction } from '@kidmodstudio/core-model';

interface CommandResult {
    message: string;
    action?: KidAction;
}

export function processUserCommand(input: string): CommandResult {
    const lower = input.toLowerCase().trim();

    // ----------------------------------------------------
    // 1. Creation Commands (The "Workflow")
    // ----------------------------------------------------
    
    // Pattern: "Erstelle (ein/einen) [Typ] namens [Name]"
    // Example: "Erstelle ein Schwert namens Excalibur"
    const createMatch = lower.match(/erstelle\s+(?:einen?|ein)\s+(\w+)\s+namens\s+(.+)/i);
    
    if (createMatch) {
        const type = createMatch[1];
        const name = createMatch[2];
        const id = name.toLowerCase().replace(/\s+/g, '_');

        if (type.includes('schwert') || type.includes('item') || type.includes('ding')) {
             return {
                message: `Alles klar! Ich schmiede ein neues Item namens "${name}" für dich.`,
                action: {
                    type: 'CREATE_ITEM',
                    payload: { 
                        id, 
                        name, 
                        type: 'item',
                        itemType: 'sword', // Default to sword for voice
                        properties: { maxStackSize: 1, attackDamage: 5 },
                        texture: { type: 'procedural', value: 'sword' }
                    }
                }
             };
        }

        if (type.includes('block') || type.includes('stein') || type.includes('erz')) {
            return {
               message: `Baumeister-Modus an! Ein neuer Block "${name}" wird erstellt.`,
               action: {
                   type: 'CREATE_BLOCK',
                   payload: { 
                       id, 
                       name, 
                       type: 'block',
                       properties: { hardness: 1, luminance: 0, transparent: false },
                       texture: { type: 'procedural', value: 'stone' }
                   }
               }
            };
       }
    }

    // ----------------------------------------------------
    // 2. Navigation / Status (Simple)
    // ----------------------------------------------------
    if (lower.includes('export') || lower.includes('bauen') || lower.includes('test')) {
        return {
            message: 'Du willst testen? Drücke einfach den grünen "Testen" Knopf unten links! Ich mache dann den Rest.',
        };
    }

    if (lower.includes('hallo') || lower.includes('hi ')) {
         return { message: 'Ssss... Hallo Bauarbeiter!' };
    }

    if (lower.includes('creeper')) {
        return { message: 'Das bin ich! Sssss...' };
    }

    // ----------------------------------------------------
    // 3. Fallback (Unknown)
    // ----------------------------------------------------
    return {
        message: '' // Empty means "Use Help Search"
    };
}
