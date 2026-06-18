// Maps items to results with bounded concurrency (default pool size 10),
// collecting the results that are not null (mirrors the original es6-promise-pool usage).
export default async function mapAsync<T, R>(
    items: Iterable<T>,
    itemMapper: (item: T) => R | Promise<R>,
    poolSize: number = 10
): Promise<R[]> {
    const iterator = items[Symbol.iterator]();
    const result: R[] = [];

    async function worker(): Promise<void> {
        for (let next = iterator.next(); !next.done; next = iterator.next()) {
            const value = await itemMapper(next.value);
            if (value !== null) {
                result.push(value);
            }
        }
    }

    await Promise.all(Array.from({length: poolSize}, () => worker()));
    return result;
}
