import _ from 'lodash';
import arrays from '../arrays';
import assert from '../assert';
import BankNameLookup from '../bank-name-lookup';
import SourceNbuAPI from './source-nbu-api';
import SourceFund from './source-fund';
import SourceMinfin from './source-minfin';
import type Audit from './audit';
import type {Bank, SourceBank, SourceBankMap} from '../model';
import SourceNbuUI from "./source-nbu-ui.ts";

class Source {
    sources: Record<string, { getBanks(): Promise<SourceBank[]> }>;

    constructor(audit: Audit) {
        this.sources = {
            // TODO: introduce audit.newBranch() method so that each source will not need to care about uniqueness of item names being audited
            api: new SourceNbuAPI(audit),
            nbu: new SourceNbuUI(audit),
            fund: new SourceFund(audit),
            minfin: new SourceMinfin(audit)
        };
    }

    async getBanks(): Promise<Bank[]> {
        const results = await Promise.all(Object.values(this.sources).map(source => source.getBanks()));
        const bankMap = arrays.toMap(Object.keys(this.sources), _.identity, (type, index) => results[index]);
        return combineBanks(bankMap);
    }

    getRatings() {
        return (this.sources.minfin as SourceMinfin).getRatings();
    }
}

export default Source;

function combineBanks(allBanks: SourceBankMap): Bank[] {
    const bankNameLookup = new BankNameLookup(allBanks);
    const bankMap = _.mapValues(allBanks, typeBanks => {
        const typeBankMap: Record<string, SourceBank> = {};
        typeBanks.forEach(bank => {
            const name = bank.names[0];
            bank.name = bankNameLookup.lookup(name);
            assert.false('Duplicate bank name', typeBankMap[bank.name], bank.name);
            typeBankMap[bank.name] = bank;
        });
        return typeBankMap;
    });

    _.forOwn(bankMap, (typeBanks, type) => console.log(type + ':', Object.keys(typeBanks).length));
    const ids = _.union(...Object.values(bankMap).map(typeBanks => Object.keys(typeBanks))).sort();
    console.log('Union:', ids.length);

    return ids.map(id => {
        const bank: Bank = {
            id: id,
            // TODO: collect 'names' field somehow as well, then rename 'id' field to 'name'
            name: {},
            names: {},
            active: {},
            dateOpen: {},
            dateIssue: {},
            site: {},
            internal: {
                id: {},
                link: {}
            }
        };
        _.forOwn(bankMap, (typeBanks, type) => {
            const typeBank: Partial<SourceBank> = typeBanks[id] || {};
            bank.name[type] = typeBank.name;
            bank.names[type] = typeBank.names;
            bank.active[type] = typeBank.active;
            // TODO: make field names consistent
            bank.dateOpen[type] = typeBank.start ?? undefined;
            bank.dateIssue[type] = typeBank.problem ?? undefined;
            bank.site[type] = typeBank.sites;
            bank.internal.id[type] = typeBank.id;
            bank.internal.link[type] = typeBank.link;
        });
        assert.equals('Name mismatch - ' + id + ' - ' + JSON.stringify(bank.name), ...definedValues(bank.name));
        assert.equals('Active mismatch - ' + id + ' - ' + JSON.stringify(bank.active), ...definedValues(bank.active));
        assert.equals('DateOpen mismatch - ' + id + ' - ' + JSON.stringify(bank.dateOpen), ...definedValues(bank.dateOpen));
        return bank;
    });
}

function definedValues(object: Record<string, any>): any[] {
    return Object.values(object).filter(value => !_.isUndefined(value));
}
