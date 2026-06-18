export default {
    equals(message: string, ...args: any[]): boolean {
        return this.false(message, new Set(args).size > 1, ...args);
    },

    notEquals(message: string, ...args: any[]): boolean {
        // It's enough to show only one argument if they are equal
        return this.true(message, new Set(args).size > 1, args[0]);
    },

    true(message: string, value: any, ...args: any[]): boolean {
        return this.false(message, !value, ...args);
    },

    false(message: string, value: any, ...args: any[]): boolean {
        if (value) {
            console.log(message + ':', args);
        }
        return !value;
    }
};
