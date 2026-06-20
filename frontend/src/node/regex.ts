export default {
    findSingleValue(string: string, regex: RegExp, mapping?: number) {
        mapping = mapping || 1;
        const match = regex.exec(string);
        return match ? match[mapping] : null;
    },

    findObject<T>(string: string, regex: RegExp, mapping: Record<keyof T, number>) {
        const match = regex.exec(string);
        return match ? buildObject(match, mapping) : null;
    },

    findManyValues(string: string, regex: RegExp, mapping?: number) {
        mapping = mapping || 1;
        return findMatches(string, regex).map(match => match[mapping!]);
    },

    findManyObjects<T>(string: string, regex: RegExp, mapping: Record<keyof T, number>) {
        return findMatches(string, regex).map(match => buildObject(match, mapping));
    },

    findManyKeyValue(string: string, regex: RegExp, keyMapping?: number, valueMapping?: number) {
        keyMapping = keyMapping || 1;
        valueMapping = valueMapping || 2;
        const items: Record<string, string> = {};
        findMatches(string, regex).forEach(match => items[match[keyMapping!]] = match[valueMapping!]);
        return items;
    }
};

function findMatches(string: string, regex: RegExp) {
    const matches: RegExpExecArray[] = [];
    let match;
    while ((match = regex.exec(string))) {
        matches.push(match);
    }
    return matches;
}

function buildObject<T>(match: RegExpExecArray, mapping: Record<keyof T, number>) {
    const item = {} as T;
    (Object.keys(mapping) as Array<keyof T>).forEach(key => item[key] = match[mapping[key]] as T[keyof T]);
    return item;
}
