// Shared domain types for the data-collection scripts.

// A bank record as produced by a single data source. `names` is always present;
// the remaining fields are filled in only by the sources that expose them.
export interface SourceBank {
    names: string[];
    name?: string;
    active?: boolean;
    start?: string | null;
    problem?: string | null;
    sites?: string[];
    id?: number | string;
    link?: string;
}

// Banks keyed by source type (api, nbu, fund, minfin, ...).
export type SourceBankMap = Record<string, SourceBank[]>;

// A bank merged across all sources, as written to banks.json. Every field is a
// map keyed by the source type so the UI can compare values between sources.
export interface Bank {
    id: string;
    name: Record<string, string | undefined>;
    names: Record<string, string[] | undefined>;
    active: Record<string, boolean | undefined>;
    dateOpen: Record<string, string | undefined>;
    dateIssue: Record<string, string | undefined>;
    site: Record<string, string[] | undefined>;
    internal: {
        id: Record<string, number | string | undefined>;
        link: Record<string, string | undefined>;
    };
}

// Ratings keyed by date, then by bank id, as written to minfin-ratings.json.
export type Ratings = Record<string, Record<string, string>>;

export interface AuditItem {
    start: number;
    total: number;
    done: number;
}

export interface AuditProgress {
    start: number;
    end: number;
}
