import _ from 'lodash';
import * as path from 'path';
import files from './files';
import urls from './urls';
import type {RequestSpec} from './urls';

export default {
    // debug just for troubleshooting
    async write(file: string, obj: any): Promise<any> {
        file = filePath(file + '.json');
        return perform('WRITE', file, async () => {
            await files.writeJson(file, obj);
            return obj;
        });
    },

    async read(file: string, url: string, spec?: RequestSpec): Promise<any> {
        file = filePath(file);
        if (await files.exists(file)) {
            return perform('READ', file, () => files.read(file));
        }
        const data = await perform(spec?.method ?? 'GET', url, () => urls.read(url, spec));
        return files.write(file, data);
    },

    async delete(file: string): Promise<any> {
        file = filePath(file);
        return (await files.exists(file)) && perform('DELETE', file, () => files.delete(file));
    },

    async clear(): Promise<any> {
        const dir = cacheDir();
        return (await files.exists(dir)) && files.rename(dir, dir + Date.now());
    }
};

function filePath(file: string): string {
    if (!path.extname(file)) {
        file += '.html';
    }
    const subFolder = _.trimStart(path.extname(file), '.');
    return cacheDir() + '/' + subFolder + '/' + file;
}

function cacheDir(): string {
    return '../data';
}

async function perform(type: string, source: string, operation: () => any): Promise<any> {
    const startTime = Date.now();
    const data = await operation();
    console.log(type, source, (Date.now() - startTime) + 'ms');
    return data;
}
