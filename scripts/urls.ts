export interface FetchInit {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
}

export default {
    async read(url: string, init?: FetchInit): Promise<string> {
        const response = await fetch(url, {
            method: init?.method ?? 'GET',
            headers: {'User-Agent': 'javascript', ...(init?.headers ?? {})},
            body: init?.body
        });
        return response.text();
    },
};
