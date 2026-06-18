export default {
    of<T>(item: T | undefined | null): T[] {
        return item ? [item] : [];
    },

    toMap<T, V>(array: T[], keyMapper: (value: T, index: number) => string, valueMapper: (value: T, index: number) => V): Record<string, V> {
        const map: Record<string, V> = {};
        array.forEach((value, index) => map[keyMapper(value, index)] = valueMapper(value, index));
        return map;
    },

    compare(array1: any[], array2: any[]): number {
        const len = Math.min(array1.length, array2.length);
        for (let i = 0; i < len; i++) {
            const diff = compare(array1[i], array2[i]);
            if (diff) {
                return diff;
            }
        }
        return compare(array1.length, array2.length);
    },

    combineIntersected<T>(arrays: T[][]): T[][] {
        interface Item {
            value: T;
            related: Set<Item>;
        }

        const itemMap: Record<string, Item> = {};
        arrays.forEach(array => array.forEach(value => {
            const item = getItem(value);
            array.filter(val => val !== value)
                .map(val => getItem(val))
                .forEach(it => {
                    item.related.add(it);
                    it.related.add(item);
                });
        }));
        const items = new Set(Object.values(itemMap));

        const combined: T[][] = [];
        Array.from(items).forEach(item => {
            items.has(item) && combined.push(fetchRelated(item));
        });
        return combined;

        function fetchRelated(item: Item): T[] {
            const related = [item.value];
            items.delete(item);
            item.related.forEach(it => items.has(it) && related.push(...fetchRelated(it)));
            return related;
        }

        function getItem(value: T): Item {
            return itemMap[String(value)] = itemMap[String(value)] || {
                value: value,
                related: new Set<Item>()
            };
        }
    }
};

function compare(a: any, b: any): number {
    return a > b ? 1 : a < b ? -1 : 0;
}
