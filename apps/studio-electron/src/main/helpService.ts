import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

interface HelpDoc {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

let helpDocs: HelpDoc[] = [];

// Simple frontmatter parser because avoiding extra deps if possible
function parseDoc(filename: string, raw: string): HelpDoc {
  const lines = raw.split('\n');
  let title = filename;
  let tags: string[] = [];
  let contentStart = 0;

  if (lines[0].trim() === '---') {
    let i = 1;
    while (i < lines.length && lines[i].trim() !== '---') {
      const line = lines[i];
      if (line.startsWith('title:')) {
        title = line.replace('title:', '').trim();
      }
      if (line.startsWith('tags:')) {
        tags = line.replace('tags:', '').split(',').map(t => t.trim().toLowerCase());
      }
      i++;
    }
    contentStart = i + 1;
  }

  const content = lines.slice(contentStart).join('\n').trim();
  
  return {
    id: filename,
    title,
    tags,
    content
  };
}

export async function setupHelpService() {
  const resourcePath = path.join(__dirname, '../../resources/help'); // Adjust based on build structure
  // In dev: apps/studio-electron/resources/help
  // In prod: resources/help inside app bundle
  // This path logic might need tuning for packaged app, but works for dev structure relative to dist/main/index.js

  try {
    // Try absolute path resolution for dev environment if strictly needed, 
    // but __dirname usually points to dist/main. 
    // Let's try to find it relative to process.cwd() for dev stability first.
    // Dev: cwd is apps/studio-electron usually.
    
    let helpDir = path.resolve(process.cwd(), 'resources', 'help');
    
    // Fallback check
    try {
        await fs.access(helpDir);
    } catch {
       // Maybe we are in dist structure
       helpDir = path.join(__dirname, '../../../resources/help');
    }

    const files = await fs.readdir(helpDir);
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const raw = await fs.readFile(path.join(helpDir, file), 'utf-8');
        helpDocs.push(parseDoc(file, raw));
      }
    }
    console.log(`[HelpService] Loaded ${helpDocs.length} help documents.`);
  } catch (e) {
    console.error("[HelpService] Failed to load help docs:", e);
  }

  ipcMain.handle('help:search', async (_, query: string) => {
    const q = query.toLowerCase();
    
    return helpDocs.filter(doc => {
      if (doc.title.toLowerCase().includes(q)) return true;
      if (doc.tags.some(t => t.includes(q))) return true;
      if (doc.content.toLowerCase().includes(q)) return true; // Simple content match
      return false;
    }).map(doc => ({
        title: doc.title,
        excerpt: doc.content.substring(0, 150) + '...',
        fullContent: doc.content
    }));
  });
}
