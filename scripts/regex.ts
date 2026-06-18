type Mapping = Record<string, number>;

export default {
    findSingleValue(string: string, regex: RegExp, mapping: number = 1): string | null {
        const match = regex.exec(string);
        return match ? match[mapping] : null;
    },

    findObject(string: string, regex: RegExp, mapping: Mapping): any {
        const match = regex.exec(string);
        return match ? buildObject(match, mapping) : null;
    },

    findManyValues(string: string, regex: RegExp, mapping: number = 1): string[] {
        return findMatches(string, regex).map(match => match[mapping]);
    },

    findManyObjects(string: string, regex: RegExp, mapping: Mapping): any[] {
        return findMatches(string, regex).map(match => buildObject(match, mapping));
    },

    findManyKeyValue(string: string, regex: RegExp, keyMapping: number = 1, valueMapping: number = 2): Record<string, string> {
        const items: Record<string, string> = {};
        findMatches(string, regex).forEach(match => items[match[keyMapping]] = match[valueMapping]);
        return items;
    }
};

function findMatches(string: string, regex: RegExp): RegExpExecArray[] {
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(string))) {
        matches.push(match);
    }
    return matches;
}

function buildObject(match: RegExpExecArray, mapping: Mapping): any {
    const item: any = {};
    Object.keys(mapping).forEach(key => item[key] = match[mapping[key]]);
    return item;
}
