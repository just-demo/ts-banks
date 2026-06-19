import _ from 'lodash';
import names from '../names';
import cache from '../cache';
import assert from '../assert';
import regex from '../regex';
import mapAsync from '../map-async';
import arrays from '../arrays';
import type Audit from './audit';
import type {Ratings, SourceBank} from '../model';

class SourceMinfin {
    private audit: Audit;

    constructor(audit: Audit) {
        this.audit = audit.branch('minfin', 4);
    }

    async getBanks(): Promise<SourceBank[]> {
        this.audit.start('banks');
        const banksHtml = await cache.read('minfin/banks', 'https://minfin.com.ua/ua/banks/all/');
        const found = regex.findManyObjects(banksHtml, /class="bank-emblem--desktop"[\S\s]+?\/company\/(.+?)\/[\S\s]+?<a href="\/ua\/company\/(.+?)\/">(.+?)<\/a>/g, {
            id: 1, alias: 2, name: 3
        });
        this.audit.end('banks');
        this.audit.start('bank', found.length);
        const banks = await mapAsync(found, async (bank: any) => {
            const bankHtml = await cache.read('minfin/banks/' + bank.id, 'https://minfin.com.ua/ua/company/' + bank.alias + '/');
            const site = regex.findSingleValue(bankHtml, /<div class="item-title">Офіційний сайт<\/div>[\S\s]+?<a.*? href="(.+?)" target="_blank">/g);
            assert.true('No site', site, bank.name);
            this.audit.end('bank');
            return {
                id: fixIdMismatch(parseInt(bank.id)),
                names: [names.normalize(bank.name)],
                link: '/ua/company/' + bank.alias,
                sites: arrays.of(site)
            };
        });
        banks.sort(names.compareNames);
        return cache.write('minfin/banks', banks);
    }

    async getRatings(): Promise<Ratings> {
        this.audit.start('dates');
        const html = await cache.read('minfin/dates', 'https://minfin.com.ua/ua/banks/rating/');
        const dates = regex.findManyValues(html, /<option value="(.+?)".*?>.*?<\/option>/g);
        this.audit.end('dates');
        this.audit.start('rating', dates.length);
        const allDateRatings = await mapAsync(dates, async (date: string) => {
            const dateHtml = await cache.read('minfin/ratings/' + date, 'https://minfin.com.ua/ua/banks/rating/?date=' + date);
            const dateRatings = regex.findManyKeyValue(dateHtml, /data-id="(.+?)"[\S\s]+?data-title="Загальний рейтинг"\s*>\s*<span[\s\S]*?>(.+?)<\/span>/g);
            this.audit.end('rating');
            return {
                date: date,
                ratings: dateRatings
            };
        });
        const ratings: Ratings = {};
        _.sortBy(allDateRatings, 'date').forEach(dateRatings => ratings[dateRatings.date] = dateRatings.ratings);
        return cache.write('minfin/ratings', ratings);
    }
}

function fixIdMismatch(id: number): number {
    // Fix id to match the one in ratings
    // TODO: why did they change id for Дельта Банк?
    return id === 174 ? 65 : id;
}

export default SourceMinfin;
