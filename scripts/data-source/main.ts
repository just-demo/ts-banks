import Audit from './audit';
import SourceMinfin from "./source-minfin.ts";
import SourceNbuAPI from "./source-nbu-api.ts";
import SourceNbuUI from "./source-nbu-ui.ts";
import SourceFund from "./source-fund.ts";

// debug particular sources
async function main() {
    const audit = new Audit();
    // const source = new SourceMinfin(audit);
    // const source = new SourceNbuAPI(audit);
    // const source = new SourceNbuUI(audit);
    const source = new SourceFund(audit);
    const result = await source.getBanks();
    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);