import _ from 'lodash';
import promiseRetry from 'promise-retry';
import names from '../names';
import cache from '../cache';
import dates from '../dates';
import assert from '../assert';
import regex from '../regex';
import mapAsync from '../map-async';
import type Audit from './audit';
import type {SourceBank} from '../model';

class SourceNbuUI {
    private audit: Audit;

    constructor(audit: Audit) {
        this.audit = audit.branch('nbu-ui', 4);
    }

    // TODO: fix it https://bank.gov.ua/ua/supervision/institutions?page=1&perPage=100&search=&status=1&uid=&suid=&date_from=&date_to=&fb_date_from=&fb_date_to=
    // Банківський нагляд -> Реєстрація та ліцензування -> Довідник банків -> Повний перелік банківських установ:
    // https://bank.gov.ua/control/bankdict/banks
    // Банківський нагляд -> Реорганізація, припинення та ліквідація:
    // https://bank.gov.ua/control/uk/publish/article?art_id=75535
    async getBanks(): Promise<SourceBank[]> {
        const allBanks = await Promise.all([readActiveBanks(this.audit), readInactiveBanks(this.audit)]);
        // Extra complexity is needed just to handle the same banks falling into both active and inactive lists.
        // Since there is only one name per an inactive bank it is ok to group by the first name only.
        // For the same reason it is safe to override inactive bank names by active ones.
        const activeBanks = _.keyBy(allBanks[0], bank => bank.names[0]);
        const inactiveBanks = _.keyBy(allBanks[1], bank => bank.names[0]);
        const banks = _.union(Object.keys(activeBanks), Object.keys(inactiveBanks)).map(name => {
            assert.false('Bank is still active', activeBanks[name] && inactiveBanks[name], name);
            return {
                ...(inactiveBanks[name] || {}),
                ...(activeBanks[name] || {})
            };
        });
        banks.sort(names.compareNames);
        return cache.write('nbu/banks', banks);
    }
}

export default SourceNbuUI;

async function readActiveBanks(audit: Audit): Promise<any[]> {
    audit.start('banks/pages/0');
    const firstHtml = await cache.read('nbu/banks/pages/' + 0, 'https://bank.gov.ua/control/bankdict/banks');
    const otherLinks = regex.findManyValues(firstHtml, /<li>\s+?<a href="(.+?)">/g);
    audit.end('banks/pages/0');
    audit.start('banks/pages/1+', otherLinks.length);
    const otherHtmlPromises = otherLinks.map((link, index) =>
        cache.read('nbu/banks/pages/' + (index + 1), 'https://bank.gov.ua/' + link).finally(() => audit.end('banks/pages/1+')));
    const htmls = await Promise.all([firstHtml, ...otherHtmlPromises]);
    const banks = _.flatten(htmls.map(html => regex.findManyObjects(html, /<tr>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<td class="cell".*?>([\S\s]*?)<\/td>\s+?<\/tr>/g, {
        link: 1,
        startDate: 4
    })));
    audit.start('bank', banks.length);
    return mapAsync(banks, async (bank: any) => {
        const linkInfo = regex.findObject(bank.link.trim(), /<a href=".*?(\d+)">\s*(.+?)\s*<\/a>/, {
            id: 1,
            name: 2
        });
        const id = parseInt(linkInfo.id);
        const link = '/control/uk/bankdict/bank?id=' + id;
        const name = extractBankPureNameSPC(linkInfo.name);
        const html: string = await promiseRetry(async (retry, number) => {
            const cacheFile = 'nbu/banks/' + id;
            try {
                if (number > 1) {
                    await cache.delete(cacheFile);
                }
                const html = await cache.read(cacheFile, 'https://bank.gov.ua' + link);
                if (html.includes('<head><title>503 Service Temporarily Unavailable</title></head>')) {
                    throw 'Error response: 503';
                }
                return html;
            } catch (error) {
                return retry(error);
            }
        });
        const fullName = extractBankPureNameSPC(html.match(/<td.*?>Назва<\/td>\s*?<td.*?>(.+?)<\/td>/)![1]);
        const shortName = extractBankPureNameSPC(html.match(/<td.*?>Коротка назва<\/td>\s*?<td.*?>(.+?)<\/td>/)![1]);
        assert.equals('Short name mismatch', name, shortName);
        audit.end('bank');
        return {
            // id: id, // not used
            names: _.uniq([name, shortName, fullName]),
            start: dates.format(bank.startDate),
            link: link,
            active: true
        };
    });
}

async function readInactiveBanks(audit: Audit): Promise<any[]> {
    audit.start('banks-inactive');
    //TODO: is art_id always the same? consider fetching the link from UI page if possible
    const link = '/control/uk/publish/article?art_id=75535';
    try {
        const html = await cache.read('nbu/banks-inactive', 'https://bank.gov.ua' + link);
        return regex.findManyObjects(html, new RegExp('<tr[^>]*>\\s*?' + '(<td[^>]*>\\s*?(<p[^>]*>\\s*?<span[^>]*>([\\S\\s]*?)<o:p>.*?<\\/o:p><\\/span><\\/p>)?\\s*?<\\/td>\\s*?)'.repeat(4) + '[\\S\\s]*?<\\/tr>', 'g'), {
            name: 3, date1: 6, date2: 9, date3: 12
        }).map((bank: any) => {
            const problem = _.min([bank.date1, bank.date2, bank.date3]
                .map((date: any) => trimHtml(date))
                .map((date: string) => dates.format(date))
                .filter((date: string | null) => date));
            return {
                names: [names.extractBankPureName(trimHtml(bank.name))],
                problem: problem,
                link: link,
                active: false
            };
        });
    } finally {
        audit.end('banks-inactive');
    }
}

function extractBankPureNameSPC(name: string): string {
    const decoded = name.replace(/&#034;/g, '"');
    assert.notEquals('No xml encoded quotes', decoded, name);
    return names.extractBankPureName(decoded);
}

function trimHtml(html: string): string {
    return (html || '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/<[^<]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
