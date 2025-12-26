import { z } from 'zod';

// ID Validation: lower_snake_case (for defining new objects)
export const IdSchema = z.string().regex(/^[a-z0-9_]+$/, "ID must be lower_snake_case (a-z, 0-9, _)");

// Reference Validation: allows namespaced IDs (e.g. minecraft:dirt)
export const RefSchema = z.string().regex(/^[a-z0-9_:]+$/, "Reference must be lower_snake_case or namespaced (e.g. mod:item)");

// --- Blocks ---
export const BlockSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  type: z.literal('block'),
  properties: z.object({
    hardness: z.number().min(0).default(1.0),
    luminance: z.number().min(0).max(15).int().default(0),
    transparent: z.boolean().default(false),
  }),
  texture: z.object({
    type: z.enum(['procedural', 'imported']),
    value: z.string(),
  }),
});

export type Block = z.infer<typeof BlockSchema>;

// --- Items ---
export const ItemSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  type: z.literal('item'),
  itemType: z.enum(['gem', 'sword']),
  properties: z.object({
    maxStackSize: z.number().int().min(1).max(64).default(64),
    attackDamage: z.number().optional(),
  }),
  texture: z.object({
    type: z.enum(['procedural', 'imported']),
    value: z.string(),
  }),
});

export type Item = z.infer<typeof ItemSchema>;

// --- Recipes ---
export const RecipeSchema = z.object({
  id: IdSchema,
  type: z.literal('crafting_shaped'),
  pattern: z.array(z.string()).length(3), 
  key: z.record(z.string().length(1), RefSchema), // Allow references here
  result: z.object({
    item: RefSchema, // Allow references here
    count: z.number().int().min(1).default(1),
  }),
});

export type Recipe = z.infer<typeof RecipeSchema>;

// --- Project Meta ---
export const ProjectMetaSchema = z.object({
  modId: IdSchema,
  name: z.string().min(1),
  version: z.string().default('1.0.0'),
  author: z.string().optional(),
  description: z.string().optional(),
});

export type ProjectMeta = z.infer<typeof ProjectMetaSchema>;

// --- Root Project ---
export const ProjectSchema = z.object({
  meta: ProjectMetaSchema,
  blocks: z.record(IdSchema, BlockSchema),
  items: z.record(IdSchema, ItemSchema),
  recipes: z.record(IdSchema, RecipeSchema),
  // History is runtime state, usually not saved in project.json, or maybe it is? 
  // The spec says "project.json (meta/blocks/items/recipes/history)".
  // Let's include it as optional or separate. For strict schema of the *file*, maybe we include it.
  // "history capped at 10" -> Likely strictly runtime, but if we want to resume undo/redo, we save it.
  // For MVP, let's keep it simple and assume history is transient or saved alongside.
});

export type Project = z.infer<typeof ProjectSchema>;
