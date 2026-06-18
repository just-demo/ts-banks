import regex from './regex';

export default {
    parse(text: string) {
        return regex.findManyObjects(text, /^GET (.*) (\d+)ms$/gm, {
            url: 1,
            time: 2
        }).map((request: any) => ({
            url: request.url,
            time: parseInt(request.time)
        }));
    }
};
