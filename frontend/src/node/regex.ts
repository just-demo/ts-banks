export default {
    findSingleValue(string: string, regex: RegExp, mapping?: any) {
        mapping = mapping || 1;
        const match = regex.exec(string);
        return match ? match[mapping] : null;
    },

    findObject(string: string, regex: RegExp, mapping: any) {
        const match = regex.exec(string);
        return match ? buildObject(match, mapping) : null;
    },

    findManyValues(string: string, regex: RegExp, mapping?: any) {
        mapping = mapping || 1;
        return findMatches(string, regex).map(match => match[mapping]);
    },

    findManyObjects(string: string, regex: RegExp, mapping: any) {
        return findMatches(string, regex).map(match => buildObject(match, mapping));
    },

    findManyKeyValue(string: string, regex: RegExp, keyMapping?: any, valueMapping?: any) {
        keyMapping = keyMapping || 1;
        valueMapping = valueMapping || 2;
        const items: any = {};
        findMatches(string, regex).forEach(match => items[match[keyMapping]] = match[valueMapping]);
        return items;
    }
};

function findMatches(string: string, regex: RegExp) {
    const matches = [];
    let match;
    while ((match = regex.exec(string))) {
        matches.push(match);
    }
    return matches;
}

function buildObject(match: any, mapping: any) {
    const item: any = {};
    Object.keys(mapping).forEach(key => item[key] = match[mapping[key]]);
    return item
}
