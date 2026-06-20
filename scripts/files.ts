import * as fs from 'fs/promises';
import * as path from 'path';

// TODO: log errors
export default {
    async write(file: string, data: string): Promise<string> {
        await fs.mkdir(path.dirname(file), {recursive: true});
        await fs.writeFile(file, data);
        return data;
    },

    writeJson(file: string, obj: unknown): Promise<string> {
        return this.write(file, JSON.stringify(obj, null, 2));
    },

    async read(file: string): Promise<string> {
        return (await fs.readFile(file)).toString('utf8');
    },

    async exists(file: string): Promise<boolean> {
        try {
            await fs.access(file);
            return true;
        } catch {
            return false;
        }
    },

    async delete(file: string): Promise<boolean> {
        await fs.unlink(file).catch(() => undefined);
        return true;
    },

    async rename(oldFile: string, newFile: string): Promise<boolean> {
        await fs.rename(oldFile, newFile);
        return true;
    }
};
