import _ from 'lodash';
import type {AuditItem, AuditProgress} from '../model';

class Audit {
    name?: string;
    count: number;
    items: Record<string, AuditItem>;
    branches: Audit[];

    constructor(name?: string, count?: number) {
        this.name = name;
        this.count = count || 0;
        this.items = {};
        this.branches = [];
    }

    branch(name: string, count?: number): Audit {
        const branch = new Audit(name, count);
        this.branches.push(branch);
        return branch;
    }

    ready(): boolean {
        return Object.values(this.items).filter(item => item.done).length >= this.count &&
            _.every(this.branches, branch => branch.ready());
    }

    start(key: string, count?: number): void {
        count = count || 1;
        this.items[key] = {
            start: Date.now(),
            total: count,
            done: 0
        };
    }

    end(key: string): void {
        this.items[key].done++;
    }

    progress(): AuditProgress {
        const ranges = this.branches.map(branch => branch.progress());
        const now = Date.now();
        let start = _.min(ranges.map(range => range.start)) || now;
        let end = _.max(ranges.map(range => range.end)) || now;
        Object.values(this.items).forEach(item => {
            start = Math.min(start, item.start);
            if (item.done && item.done < item.total) {
                end = Math.max(end, item.start + (now - item.start) * item.total / item.done);
            }
        });

        return {
            start: start,
            end: end
        };
    }
}

export default Audit;
