import _ from 'lodash';
import names from '../names';
import cache from '../cache';
import dates from '../dates';
import assert from '../assert';
import regex from '../regex';
import type Audit from './audit';
import type {SourceBank} from '../model';

class SourceNbuUI {
    private audit: Audit;

    constructor(audit: Audit) {
        this.audit = audit.branch('nbu-ui', 2);
    }

    // Банківський нагляд -> Реєстрація та ліцензування -> Перелік банків:
    // https://bank.gov.ua/ua/supervision/institutions
    async getBanks(): Promise<SourceBank[]> {
        const allBanks = await Promise.all([
            readBanks(this.audit, 'active', 1, true),
            readBanks(this.audit, 'inactive', 2, false)
        ]);
        const activeBanks = _.keyBy(allBanks[0], bank => bank.id!);
        const inactiveBanks = _.keyBy(allBanks[1], bank => bank.id!);
        const banks = _.union(Object.keys(activeBanks), Object.keys(inactiveBanks)).map(id => {
            assert.false('Bank is both active and inactive', activeBanks[id] && inactiveBanks[id], id);
            return activeBanks[id] || inactiveBanks[id];
        });
        banks.sort(names.compareNames);
        return cache.write('nbu/banks', banks);
    }
}

export default SourceNbuUI;

async function readBanks(audit: Audit, label: string, status: number, active: boolean): Promise<SourceBank[]> {
    audit.start('banks/' + label);
    const banks: SourceBank[] = [];
    for (let page = 1; ; page++) {
        const cards = splitCards(await readPage(label, status, page));
        if (!cards.length) {
            break;
        }
        cards.forEach(card => banks.push(parseCard(card, active)));
    }
    audit.end('banks/' + label);
    return banks;
}

async function readPage(label: string, status: number, page: number): Promise<string> {
    // The page ignores GET query params; search results come from a POST to /supervision/institutions1, this is how the page actually works that is why POST is used here
    return cache.read(`nbu/banks/${label}/${page}`, 'https://bank.gov.ua/supervision/institutions1', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest'},
        body: `page=${page}&perPage=100&search=&status=${status}&type%5B%5D=1&uid=&suid=&date_from=&date_to=&fb_date_from=&fb_date_to=`
    });
}

function splitCards(html: string): string[] {
    return html.split('row cols search-result').slice(1);
}

function parseCard(card: string, active: boolean): SourceBank {
    const id = regex.findSingleValue(card, /institutions\/(\d+)/)!;
    const shortName = extractPureName(regex.findSingleValue(card, /<th>Скорочене найменування<\/th>\s*<td>(.+?)<\/td>/)!);
    const fullName = extractPureName(regex.findSingleValue(card, /<th>Повне найменування<\/th>\s*<td>(.+?)<\/td>/)!);
    return {
        names: _.uniq([shortName, fullName]),
        start: dates.format(regex.findSingleValue(card, /<th>Дата внесення до Державного реєстру банків<\/th>\s*<td>(.+?)<\/td>/)),
        id: parseInt(id),
        link: '/ua/supervision/institutions/' + id,
        active: active
    };
}

function extractPureName(name: string): string {
    return names.extractBankPureName(name.replace(/&quot;/g, '"').replace(/&#034;/g, '"'));
}
