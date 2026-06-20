import iconv from 'iconv-lite';

export default {
    async read(url: string, encoding?: string | null): Promise<string | Buffer> {
        const response = await fetch(url, {
            // TODO: find a way to disable cors, this one does not work in browser
            // mode: 'no-cors',
            headers: {'User-Agent': 'javascript'}
        });
        const buffer = Buffer.from(await response.arrayBuffer());
        if (encoding === null) {
            return buffer;
        }
        return encoding ? iconv.decode(buffer, encoding) : buffer.toString('utf8');
    },
};
