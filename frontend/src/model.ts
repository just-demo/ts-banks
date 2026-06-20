export type SourceKey = 'api' | 'nbu' | 'fund' | 'minfin';

export type BySource<T> = Partial<Record<SourceKey, T>>;

export interface Bank {
    id: string;
    name: BySource<string>;
    names: BySource<string[]>;
    active: BySource<boolean>;
    dateOpen: BySource<string>;
    dateIssue: BySource<string>;
    site: BySource<string[]>;
    internal: {
        id: { minfin?: number };
        link: BySource<string>;
    };
}

export type Ratings = Record<string, Record<string, string>>;

export interface RatingBank {
    id?: number;
    name: string;
    dateOpen?: string;
    dateClosed?: string;
    dateIssueMin?: string;
    dateIssueMax?: string;
    active: boolean;
    data: Bank;
}
