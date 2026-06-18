// npm run refresh   (runs `tsx main.ts` from the scripts/ directory)
import Source from './data-source/source';
import Audit from './data-source/audit';
import files from './files';

const startTime = Date.now();
const audit = new Audit();
const source = new Source(audit);
await Promise.all([
    source.getBanks().then(banks => files.writeJson('../frontend/public/data/banks.json', banks)),
    source.getRatings().then(ratings => files.writeJson('../frontend/public/data/minfin-ratings.json', ratings))
]);
console.log('Total time:', Date.now() - startTime);
//printProgress();

function printProgress() {
    if (audit.ready()) {
        const progress = audit.progress();
        const now = Date.now();
        const total = progress.end - progress.start;
        const taken = now - progress.start;
        const left = progress.end - now;
        console.log('Progress (total/taken/left): ', Math.round(100 * taken / total) + '%', total, taken, left);
        if (left <= 0) {
            return;
        }
    } else {
        console.log('Estimating...');
    }
    setTimeout(printProgress, 100);
}
