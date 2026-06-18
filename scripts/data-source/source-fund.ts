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
    const html = await cache.read('fund/banks-active', 'http://www.fg.gov.ua/uchasnyky-fondu');
    const banks = regex.findManyObjects(html, /<tr.*?>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>(.*?)<\/td>\s+?<td.*?>([\S\s]*?)<\/td>\s+?<\/tr>/g, {
        name: 2,
        date: 4,
        site: 7
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
    audit.start('banks-not-paying');
    const html = await cache.read('fund/banks-not-paying', 'http://www.fg.gov.ua/not-paying');
    const banks = regex.findManyObjects(html, /<h3 class="item-title"><a href="(\/.+?\/.+?\/(\d+?)-.+?)">[\S\s]+?(.+?)<\/a>/g, {
        link: 1,
        id: 2,
        name: 3
    });

    audit.end('banks-not-paying');
    audit.start('bank', banks.length);
    return mapAsync(banks, async (bank: any) => {
        const htmlBank = await cache.read('fund/banks/' + bank.id, 'http://www.fg.gov.ua' + bank.link);
        const problems = regex.findManyValues(htmlBank, /<td[^>]*>Термін [^<]*<\/td>\s*<td[^>]*>[^<]*?(\d{2}\.\d{2}\.\d{4})[^<]*<\/td>/g)
            .map(date => dates.format(date));
        audit.end('bank');
        return {
            name: names.extractBankPureName(bank.name),
            problem: _.min(problems),
            link: bank.link,
            active: false
        };
    });
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
