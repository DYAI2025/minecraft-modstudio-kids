import { ProjectSchema, Project } from './schema';
import { z } from 'zod';

export type ValidationResult = 
  | { success: true; data: Project }
  | { success: false; errors: string[] };

export function validateProject(json: unknown): ValidationResult {
  const result = ProjectSchema.safeParse(json);

  if (!result.success) {
    // ZodError should have .issues or .errors
    const issues = result.error.issues;
    const errors = issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`);
    return { success: false, errors };
  }

  const project = result.data;
  const semanticErrors: string[] = [];

  // Semantic checks (Referential integrity)
  const allIds = new Set([
     ...Object.keys(project.blocks), 
     ...Object.keys(project.items),
     // vanilla IDs could be added here later
  ]);

  // Check recipes
  Object.values(project.recipes).forEach(recipe => {
    // Check result
    if (!allIds.has(recipe.result.item)) {
        // Allow vanilla items? For MVP, assume we might need a whitelist of vanilla items or strict local refs.
        // Let's assume strict local refs OR valid MC id pattern (but we can't check existence of vanilla easily yet).
        // Warning only? Or basic check?
        // Let's stick to strict check for now, assuming users craft their own things mainly, OR we allow "minecraft:..."
        if (!recipe.result.item.startsWith('minecraft:')) {
            semanticErrors.push(`Recipe ${recipe.id}: Result item '${recipe.result.item}' definitions not found in project.`);
        }
    }
    
    // Check keys
    Object.entries(recipe.key).forEach(([char, itemId]) => {
         if (!allIds.has(itemId) && !itemId.startsWith('minecraft:')) {
             semanticErrors.push(`Recipe ${recipe.id}: Key '${char}' references unknown item '${itemId}'.`);
         }
    });
  });

  if (semanticErrors.length > 0) {
      return { success: false, errors: semanticErrors };
  }

  return { success: true, data: project };
}
