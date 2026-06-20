import regex from './regex';

export interface LogRequest {
    url: string;
    time: number;
}

export default {
    parse(text: string): LogRequest[] {
        return regex.findManyObjects<{url: string; time: string}>(text, /^GET (.*) (\d+)ms$/gm, {
            url: 1,
            time: 2
        }).map(request => ({
            url: request.url,
            time: parseInt(request.time)
        }));
    }
};
