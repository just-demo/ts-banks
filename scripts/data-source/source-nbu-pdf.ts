import _ from 'lodash';
import promiseRetry from 'promise-retry';
import names from '../names';
import cache from '../cache';
import dates from '../dates';
import regex from '../regex';
import pdfs from '../pdfs';
import mapAsync from '../map-async';
import type Audit from './audit';
import type {SourceBank} from '../model';

// TODO: rename not-banks to just pdf everywhere, including cache and audit
class SourceNbuPDF {
    private audit: Audit;

    constructor(audit: Audit) {
        this.audit = audit.branch('nbu-pdf', 2);
    }

    // Банківський нагляд -> Реєстрація та ліцензування -> Банківські ліцензії та види діяльності банків України:
    // https://bank.gov.ua/control/uk/publish/article?art_id=52047
    async getBanks(): Promise<SourceBank[]> {
        this.audit.start('pdfs');
        const startTime = Date.now();
        // TODO: why does "ІННОВАЦІЙНО-ПРОМИСЛОВИЙ БАНК" fall into different buckets?
        // TODO: is art_id the same? consider fetching the link from UI page
        const html = await cache.read('nbu/not-banks', 'https://bank.gov.ua/control/uk/publish/article?art_id=52047');
        const bankFiles: Record<string, string[]> = {};
        regex.findManyObjects(html, /<a\s+href="files\/Licences_bank\/(.+?)".*?>([\s\S]+?)<\/a>/g, {
            file: 1, name: 2
        }).forEach((bank: any) => {
            bankFiles[bank.file] = bankFiles[bank.file] || [];
            bankFiles[bank.file].push(names.normalize(names.removeTags(bank.name)));
        });
        const fileList = Object.keys(bankFiles);
        this.audit.end('pdfs');
        this.audit.start('pdf', fileList.length);
        const banks = await mapAsync<string, any>(fileList, async file => {
            const link = '/files/Licences_bank/' + file;
            const textFile = 'nbu/not-banks/text/' + file.split('.')[0] + '.txt';
            // TODO: remove this temporary optimization and inline process function when there only one usage left
            try {
                let text = await cache.calc(textFile, () => null);
                if (!text) {
                    text = await promiseRetry(async (retry, number) => {
                        const cacheFile = 'nbu/not-banks/pdf/' + file;
                        try {
                            if (number > 1) {
                                await cache.delete(cacheFile);
                            }
                            const pdf = await cache.download(cacheFile, 'https://bank.gov.ua' + link);
                            return await cache.calc(textFile, () => pdfs.parse(pdf));
                        } catch (error) {
                            return retry(error);
                        }
                    });
                }
                const bank = regex.findObject(text, /^(.+?)Назва банку(.*?Дата відкликання(\d{2}\.\d{2}\.\d{4}))?/g, {
                    name: 1, problem: 3
                });
                const bankNames = [names.extractBankPureName(bank.name), ...bankFiles[file]].map(names.normalize);
                return {
                    names: _.uniq(bankNames),
                    problem: dates.format(bank.problem) || undefined,
                    link: link,
                    active: !bank.problem
                };
            } catch (error) {
                console.log('PDF error:', file, error);
            } finally {
                this.audit.end('pdf');
            }
        });
        banks.sort(names.compareNames);
        console.log('PDF time:', Date.now() - startTime);
        return cache.write('nbu/banks-pdf', banks);
    }
}

export default SourceNbuPDF;
