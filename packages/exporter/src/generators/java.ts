import { Project } from '@kidmodstudio/core-model';

export function generateRegistryClass(project: Project, packagePath: string): string {
    const { modId } = project.meta;

    let blockRegistrations = '';
    let itemRegistrations = '';
    let itemGroupRegistrations = ''; // MVP: minimal creative tab?

    // Blocks
    for (const [id, block] of Object.entries(project.blocks)) {
        const safeName = id.toUpperCase();
        const registryName = id.toLowerCase();
        // MVP: Simple block settings. Hardness fixed for now.
        // Fabric 1.21 uses Settings.create()
        blockRegistrations += `    public static final Block ${safeName} = registerBlock("${registryName}", new Block(AbstractBlock.Settings.create().strength(1.0f)));\n`;
    }

    // Items
    for (const [id, item] of Object.entries(project.items)) {
        const safeName = id.toUpperCase();
        const registryName = id.toLowerCase();
        itemRegistrations += `    public static final Item ${safeName} = registerItem("${registryName}", new Item(new Item.Settings()));\n`;
    }

    return `package ${packagePath};

import net.fabricmc.fabric.api.itemgroup.v1.ItemGroupEvents;
import net.minecraft.block.AbstractBlock;
import net.minecraft.block.Block;
import net.minecraft.item.Item;
import net.minecraft.item.ItemGroups;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

public class ModRegistry {

    // Blocks
${blockRegistrations}

    // Items
${itemRegistrations}

    private static Block registerBlock(String name, Block block) {
        registerItem(name, new net.minecraft.item.BlockItem(block, new Item.Settings()));
        return Registry.register(Registries.BLOCK, Identifier.of("${modId}", name), block);
    }

    private static Item registerItem(String name, Item item) {
        return Registry.register(Registries.ITEM, Identifier.of("${modId}", name), item);
    }

    public static void registerAll() {
        // Add all items to Ingredients tab for simplicity in MVP
        ItemGroupEvents.modifyEntriesEvent(ItemGroups.INGREDIENTS).register(entries -> {
            ${Object.keys(project.blocks).map(id => `entries.add(${id.toUpperCase()});`).join('\n            ')}
            ${Object.keys(project.items).map(id => `entries.add(${id.toUpperCase()});`).join('\n            ')}
        });
    }
}
`;
}
