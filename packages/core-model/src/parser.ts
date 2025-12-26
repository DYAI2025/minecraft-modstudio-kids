import { KidAction } from './actions';

export interface ParseResult {
  action: KidAction | null;
  confidence: number; // 0-1
  error?: string;
}

export class CommandParser {
  /**
   * Parses a raw text command into a KidAction.
   * MVP: Supports basic German commands via Regex.
   */
  static parse(text: string): ParseResult {
    const normalized = text.trim().toLowerCase();

    // 1. CREATE BLOCK
    // Patterns: "erstelle einen block namens [name]", "neuer block [name]"
    const createBlockMatch = normalized.match(/(?:erstelle|neuer) (?:einen )?block (?:namens |mit dem namen )?(.+)/);
    if (createBlockMatch) {
      const name = createBlockMatch[1].trim();
      // Generate a simple ID from name
      const id = 'block_' + name.replace(/[^a-z0-9]/g, '_');
      
      return {
        action: {
          type: 'CREATE_BLOCK',
          payload: {
            id,
            name: this.capitalize(name), // Display name
            type: 'block',
            properties: {
                hardness: 1.0,
                luminance: 0,
                transparent: false
            },
            texture: {
                type: 'procedural',
                value: 'rock'
            }
          }
        },
        confidence: 0.9
      };
    }

    // 2. CREATE ITEM
    // Patterns: "erstelle ein item namens [name]", "neuer gegenstand [name]"
    const createItemMatch = normalized.match(/(?:erstelle|neuer) (?:ein )?(?:item|gegenstand) (?:namens |mit dem namen )?(.+)/);
    if (createItemMatch) {
      const name = createItemMatch[1].trim();
      const id = 'item_' + name.replace(/[^a-z0-9]/g, '_');

      return {
        action: {
          type: 'CREATE_ITEM',
          payload: {
            id,
            name: this.capitalize(name),
            type: 'item',
            itemType: 'gem',
            properties: {
                maxStackSize: 64
            },
            texture: {
                type: 'procedural',
                value: 'gem'
            }
          }
        },
        confidence: 0.9
      };
    }

    // 3. SELECT / EDIT (Future)
    // "bearbeite block [name]"

    return { action: null, confidence: 0, error: "Command not understood" };
  }

  private static capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
