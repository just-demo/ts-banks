import * as fs from 'fs/promises';
import * as path from 'path';
import iconv from 'iconv-lite';

// TODO: log errors
export default {
    async write(file: string, data: string | Buffer, encoding?: BufferEncoding | null): Promise<string | Buffer> {
        await fs.mkdir(path.dirname(file), {recursive: true});
        await fs.writeFile(file, data, encoding ?? undefined);
        return data;
    },

    writeJson(file: string, obj: unknown): Promise<string | Buffer> {
        return this.write(file, JSON.stringify(obj, null, 2));
    },

    async read(file: string, encoding?: string | null): Promise<string | Buffer> {
        const data = await fs.readFile(file);
        return encoding === null ? data : iconv.decode(data, encoding || 'utf8');
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
