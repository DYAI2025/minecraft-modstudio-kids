import * as fs from 'fs/promises';
import * as path from 'path';
import { Project } from '@kidmodstudio/core-model';
import { generateRegistryClass } from './generators/java';
import { generateLangJson, generateBlockState, generateBlockModel, generateItemBlockModel, generateItemModel } from './generators/json';
import { dataUriToBuffer } from './generators/assets';
import { runBuild, BuildResult } from './builder';

export { runBuild, BuildResult };
export interface ExportOptions {
    outputDir: string;
    project: Project;
}

export async function exportProject(options: ExportOptions) {
    const { outputDir, project } = options;
    const { modId, name, description } = project.meta;

    // 1. Scaffold Template
    await scaffoldTemplate({
        outputDir,
        modId,
        modName: name,
        description: description
    });

    // 2. Generate Java
    // ModRegistry.java
    const registryContent = generateRegistryClass(project, 'com.example');
    await fs.writeFile(path.join(outputDir, 'src/main/java/com/example/ModRegistry.java'), registryContent);

    // Update TemplateMod.java to call ModRegistry
    const mainClassPath = path.join(outputDir, 'src/main/java/com/example/TemplateMod.java');
    let mainClass = await fs.readFile(mainClassPath, 'utf-8');
    mainClass = mainClass.replace('// Register items and blocks here', 'ModRegistry.registerAll();');
    await fs.writeFile(mainClassPath, mainClass);

    // 3. Generate Resources
    const assetsDir = path.join(outputDir, `src/main/resources/assets/${modId}`);
    
    // Lang
    const langDir = path.join(assetsDir, 'lang');
    await fs.mkdir(langDir, { recursive: true });
    await fs.writeFile(path.join(langDir, 'en_us.json'), generateLangJson(project));

    // Blocks
    for (const [id, block] of Object.entries(project.blocks)) {
        // Blockstates
        const bsDir = path.join(assetsDir, 'blockstates');
        await fs.mkdir(bsDir, { recursive: true });
        await fs.writeFile(path.join(bsDir, `${id}.json`), generateBlockState(modId, id));

        // Model Block
        const bmDir = path.join(assetsDir, 'models/block');
        await fs.mkdir(bmDir, { recursive: true });
        await fs.writeFile(path.join(bmDir, `${id}.json`), generateBlockModel(modId, id));

        // Model Item (BlockItem)
        const imDir = path.join(assetsDir, 'models/item');
        await fs.mkdir(imDir, { recursive: true });
        await fs.writeFile(path.join(imDir, `${id}.json`), generateItemBlockModel(modId, id));
    }

    // Items
    for (const [id, item] of Object.entries(project.items)) {
         // Model Item
         const imDir = path.join(assetsDir, 'models/item');
         await fs.mkdir(imDir, { recursive: true });
         await fs.writeFile(path.join(imDir, `${id}.json`), generateItemModel(modId, id));
    }
}

export async function scaffoldTemplate(options: { outputDir: string, modId: string, modName: string, description?: string }) {
    const templateDir = path.resolve(__dirname, '../template'); 
    
    const { outputDir, modId, modName, description } = options;

    await fs.mkdir(outputDir, { recursive: true });

    async function copyDir(src: string, dest: string) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                await copyDir(srcPath, destPath);
            } else {
                if (entry.name.endsWith('.png') || entry.name.endsWith('.jar')) {
                     await fs.copyFile(srcPath, destPath);
                     continue;
                }

                let content = await fs.readFile(srcPath, 'utf-8');
                
                content = content.replace(/{{MOD_ID}}/g, modId);
                content = content.replace(/{{MOD_NAME}}/g, modName);
                content = content.replace(/{{MOD_DESCRIPTION}}/g, description || 'Created with KidModStudio');

                await fs.writeFile(destPath, content);
            }
        }
    }

    try {
        await copyDir(templateDir, outputDir);
        
        // Rename mixin file
        const mixinSrc = path.join(outputDir, 'src/main/resources/mixin.json');
        const mixinDest = path.join(outputDir, `src/main/resources/${modId}.mixins.json`);
        
        try {
            await fs.rename(mixinSrc, mixinDest);
        } catch (e) {
            // Include fallback or logging
        }

    } catch (e) {
        console.error("Scaffold failed", e);
        throw e;
    }
}
