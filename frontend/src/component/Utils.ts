export default {
    truncate(str: string, length: number) {
        return str && str.length > length ? str.substring(0, length - 3) + '...' : str;
    },

    ifExceeds(str: string, length: number) {
        return str && str.length > length ? str : undefined;
    }
}
