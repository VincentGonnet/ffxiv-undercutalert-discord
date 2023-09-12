import path from 'node:path';

export async function getWorldsByServer(serverName: string) : Promise<string[]> {
    const filePath = path.join(import.meta.dir, '../data', 'worlds.json');
    const worldsFile = Bun.file(filePath);
    const worlds = await worldsFile.json();
    return worlds[serverName];
}