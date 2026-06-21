import _ from 'lodash';
import names from '../names';
import cache from '../cache';
import dates from '../dates';
import assert from '../assert';
import regex from '../regex';
import mapAsync from '../map-async';
import type Audit from './audit';
import type {SourceBank} from '../model';

class SourceFund {
    private audit: Audit;

    constructor(audit: Audit) {
        this.audit = audit.branch('fund', 3);
    }

    async getBanks(): Promise<SourceBank[]> {
        const allBanks = await Promise.all([readActiveBanks(this.audit), readInactiveBanks(this.audit)]);
        const activeBanks = _.keyBy(allBanks[0], 'name');
        const inactiveBanks = _.keyBy(allBanks[1], 'name');
        const banks = _.union(Object.keys(activeBanks), Object.keys(inactiveBanks)).map(name => {
            assert.false('Bank is still active', activeBanks[name] && inactiveBanks[name], name);
            return {
                ...(inactiveBanks[name] || {}),
                ...(activeBanks[name] || {})
            };
        }).map((bank: any) => ({
            names: [bank.name],
            // start: bank.start, // this start is different from bank opening date
            problem: bank.problem,
            sites: bank.sites,
            link: bank.link,
            active: bank.active
        }));
        banks.sort(names.compareNames);
        return cache.write('fund/banks', banks);
    }
}

export default SourceFund;

async function readActiveBanks(audit: Audit): Promise<any[]> {
    audit.start('banks-active');
    const html = await cache.read('fund/banks-active', 'https://www.fg.gov.ua/pro-fond/banki-uchasniki-fondu');
    const banks = regex.findManyObjects(html, /<tr[^>]*>\s*<td[^>]*>\s*\d+\s*<\/td>\s*<td[^>]*>[\s\S]*?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*(?:<td[^>]*>[\s\S]*?<\/td>\s*){3}<td[^>]*>([\s\S]*?)<\/td>\s*(?:<td[^>]*>[\s\S]*?<\/td>\s*){2}<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/g, {
        name: 1,
        date: 2,
        site: 3
    }).map((bank: any) => ({
        name: names.extractBankPureName(bank.name),
        start: dates.format(bank.date),
        sites: extractBankPureSites(bank.site),
        active: true
    }));
    banks.forEach((bank: any) => assert.false('Many sites', bank.sites.length > 1, bank.name, bank.sites));
    audit.end('banks-active');
    return banks;
}

async function readInactiveBanks(audit: Audit): Promise<any[]> {
    audit.start('banks-inactive');
    const banks: any[] = [];
    for (let page = 1; ; page++) {
        const cards = parseInactiveCards(await cache.read(
            'fund/banks-inactive/' + page,
            'https://www.fg.gov.ua/banki-v-upravlinni-fondu?page=' + page));
        if (!cards.length) {
            break;
        }
        banks.push(...cards);
    }
    audit.end('banks-inactive');

    audit.start('bank', banks.length);
    return mapAsync(banks, async (bank: any) => {
        const htmlBank = await cache.read('fund/banks/' + bank.id, 'https://www.fg.gov.ua' + bank.link);
        const problems = extractProblemDates(htmlBank);
        audit.end('bank');
        return {
            name: names.extractBankPureName(bank.name),
            problem: _.min(problems),
            link: bank.link,
            active: false
        };
    });
}

function parseInactiveCards(html: string): any[] {
    return regex.findManyObjects(html, /<a href="(?:https:\/\/www\.fg\.gov\.ua)?(\/banki-v-upravlinni-fondu\/[^"]+)" class="item">[\s\S]*?<div class="title">\s*([\s\S]*?)\s*<\/div>/g, {
        link: 1,
        name: 2
    }).map((bank: any) => ({...bank, id: bank.link.split('/').pop()}));
}

function extractProblemDates(html: string): (string | null)[] {
    return regex.findManyObjects(html, /<div class="title">\s*[^<]*(?:тимчасов|ліквідац)[^<]*<\/div>\s*<div class="value">([\s\S]*?)<\/div>/gi, {value: 1})
        .flatMap((block: any) => regex.findManyValues(block.value, /(\d{2}\.\d{2}\.\d{4})/g))
        .map(date => dates.format(date));
}

function extractBankPureSites(bankFullSite: string): string[] {
    bankFullSite = bankFullSite
        .replace(/&nbsp;/g, '')
        .replace(/<strong>([^<]*)<\/strong>/g, '$1')
        .trim();
    if (!assert.true('Site is empty', bankFullSite)) {
        return [];
    }

    const sites = removeDuplicateSites(regex.findManyObjects(bankFullSite, /href="(.+?)"|(http[^"<\s]+)|[^/](www[^"<\s]+)/g, {
        href: 1,
        http: 2,
        www: 3
    }).map((site: any) => names.siteName(site.href || site.http || site.www)));

    if (!assert.true('No site matches', sites.length, bankFullSite)) {
        return (sites as any).add(bankFullSite);
    }

    assert.false('Many site matches', sites.length > 1, bankFullSite, sites);
    return sites;
}

function removeDuplicateSites(siteList: string[]): string[] {
    const sites = new Set(siteList);
    const result = new Set(sites);
    sites.forEach(site => {
        const isDuplicate = ['https', 'http']
            .map(schema => schema + '://')
            .filter(schemaPrefix => !site.startsWith(schemaPrefix))
            .map(schemaPrefix => schemaPrefix + site)
            .filter(siteWithSchema => sites.has(siteWithSchema))
            .length;
        if (isDuplicate) {
            result.delete(site);
        }
    });
    return Array.from(result);
}
