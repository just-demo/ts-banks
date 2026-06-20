export interface RequestSpec {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
}

export default {
    async read(url: string, spec?: RequestSpec): Promise<string> {
        const response = await fetch(url, {
            method: spec?.method ?? 'GET',
            headers: {'User-Agent': 'javascript', ...(spec?.headers ?? {})},
            body: spec?.body
        });
        return response.text();
    },
};
