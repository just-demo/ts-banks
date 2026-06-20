export interface LogRequest {
    url: string;
    time: number;
}

export default {
    parse(text: string): LogRequest[] {
        const regex = /^GET (.*) (\d+)ms$/gm;
        const requests: LogRequest[] = [];
        let match;
        while ((match = regex.exec(text))) {
            requests.push({url: match[1], time: parseInt(match[2])});
        }
        return requests;
    }
};
