import { Project } from '@kidmodstudio/core-model';

export function generateLangJson(project: Project): string {
    const lang: Record<string, string> = {};
    
    // Blocks
    for (const [id, block] of Object.entries(project.blocks)) {
        lang[`block.${project.meta.modId}.${id}`] = block.name;
    }
    
    // Items
    for (const [id, item] of Object.entries(project.items)) {
        lang[`item.${project.meta.modId}.${id}`] = item.name;
    }

    return JSON.stringify(lang, null, 2);
}

export function generateBlockState(modId: string, blockId: string): string {
    return JSON.stringify({
        variants: {
            "": { "model": `${modId}:block/${blockId}` }
        }
    }, null, 2);
}

export function generateBlockModel(modId: string, blockId: string): string {
    // Basic cube all
    return JSON.stringify({
        parent: "minecraft:block/cube_all",
        textures: {
            all: `${modId}:block/${blockId}`
        }
    }, null, 2);
}

export function generateItemBlockModel(modId: string, blockId: string): string {
    return JSON.stringify({
        parent: `${modId}:block/${blockId}`
    }, null, 2);
}

export function generateItemModel(modId: string, itemId: string): string {
    return JSON.stringify({
        parent: "minecraft:item/generated",
        textures: {
            layer0: `${modId}:item/${itemId}`
        }
    }, null, 2);
}
