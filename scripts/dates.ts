export default {
    format(date: string | undefined | null): string | null {
        return date ? date.split('.').reverse().map(part => part.trim()).join('-') : null;
    },
};
