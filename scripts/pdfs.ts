import * as pdfjs from 'pdfjs-dist';

export default {
    async parse(buffer: Buffer): Promise<string> {
        const document = await (pdfjs as any).getDocument({data: buffer}).promise;
        const page = await document.getPage(1);
        const text = await page.getTextContent();
        return text.items.map((item: any) => item.str).join('');
    }
};
