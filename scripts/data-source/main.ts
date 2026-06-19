import Audit from './audit';
import SourceMinfin from "./source-minfin.ts";

// debug particular sources
async function main() {
    const audit = new Audit();
    const source = new SourceMinfin(audit);
    const result = await source.getBanks();
    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);