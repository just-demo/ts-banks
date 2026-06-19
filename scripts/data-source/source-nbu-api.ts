import names from '../names';
import cache from '../cache';
import dates from '../dates';
import type Audit from './audit';
import type {SourceBank} from '../model';

class SourceNbuAPI {
    private audit: Audit;

    constructor(audit: Audit) {
        this.audit = audit.branch('nbu-api', 1);
    }

    // Національний банк України > Відкриті дані > API для розробників -> Довідник банків та їх відокремлених підрозділів:
    // https://bank.gov.ua/ua/open-data/api-dev
    async getBanks(): Promise<SourceBank[]> {
        this.audit.start('banks');
        const jsonStr = await cache.read('nbu/banks-api', 'https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0&json');
        const json: any = JSON.parse(jsonStr);
        const banks: SourceBank[] = json.map((record: any) => ({
            // id: parseInt(record['NKB']), // not used
            // TODO: is there full name? if so - add it as well
            names: [names.extractBankPureName(record['SHORTNAME'])],
            start: dates.format(record['D_OPEN']),
            problem: dates.format(record['D_STAN']) || undefined,
            // 'Нормальний', 'Режим ліквідації', 'Реорганізація', 'Неплатоспроможний'
            active: ['Нормальний'.toUpperCase(), 'Реорганізація'.toUpperCase()].includes(record['N_STAN'].toUpperCase())
        }));
        banks.sort(names.compareNames);
        this.audit.end('banks');
        return cache.write('nbu/banks-api', banks);
    }
}

export default SourceNbuAPI;
