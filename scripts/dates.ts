import moment from 'moment';

export default {
    format(date: string | undefined | null): string | null {
        return date ? date.split('.').reverse().map(part => part.trim()).join('-') : null;
    },

    formatTimestamp(timestamp: string | number): string {
        return moment(timestamp).format('YYYY-MM-DD');
    }
};
