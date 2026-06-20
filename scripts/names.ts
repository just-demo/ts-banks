import assert from './assert';
import regex from './regex';
import arrays from './arrays';
import type {SourceBank} from './model';

export default {

    siteName(site: string): string {
        return site.replace(/(?<!:|:\/)\/(?!ukraine$).*/g, '');
    },

    extractBankPureName(bankFullName: string): string {
        let name = bankFullName;
        name = regex.findSingleValue(name, /.*«(.+?)»/) || name;
        name = regex.findSingleValue(name, /.*"(.+?)"/) || name;
        name = regex.findSingleValue(name, /.*\s'(.+?)'/) || name;
        assert.notEquals('Full name is pure name', name, bankFullName);
        return this.normalize(name);
    },

    normalize(name: string): string {
        return name.trim().toUpperCase()
            .replace(/`/g, '\'')
            .replace(/\s+/g, ' ')
            .replace(/\s*-\s*/g, '-')
            // TODO: replace "( " => "(" as well
            .replace(/^БАНК /, '')
            .replace(/ БАНК$/, '');
    },

    // TODO: move to a better place?
    // Just for predictable sorting taking into account asynchrony being introduced
    compareNames(a: SourceBank, b: SourceBank): number {
        return arrays.compare(a.names, b.names);
    }
};
