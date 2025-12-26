import { Block, Item, Recipe, ProjectMeta } from './schema.js';

export type KidAction =
  | { type: 'UPDATE_META'; payload: Partial<ProjectMeta> }
  // Blocks
  | { type: 'CREATE_BLOCK'; payload: Block }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; update: Partial<Block> } }
  | { type: 'DELETE_BLOCK'; payload: { id: string } }
  // Items
  | { type: 'CREATE_ITEM'; payload: Item }
  | { type: 'UPDATE_ITEM'; payload: { id: string; update: Partial<Item> } }
  | { type: 'DELETE_ITEM'; payload: { id: string } }
  // Recipes
  | { type: 'CREATE_RECIPE'; payload: Recipe }
  | { type: 'UPDATE_RECIPE'; payload: { id: string; update: Partial<Recipe> } }
  | { type: 'DELETE_RECIPE'; payload: { id: string } }
  // History - handled by wrapper usually, but can be explicit actions
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_PROJECT'; payload: ProjectMeta & { blocks: any, items: any, recipes: any } }; // Simplified type for now, used Project in reducer effectively
