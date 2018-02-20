// Maybe data should be more explicit, but we'll probably wait until the structure is more definite.

export interface Aggregations {
    [key : string] : Agg
}
export interface Agg {
    buckets : Bucket[],
    type : string,
    value : any
}

export interface Bucket {
    key : string,
    selected : boolean,
    parent: string,
    doc_count : number,

    from: number,
    to: number
}

export class StrixResult {
    count: number;
    data: any[];
    aggregations: Aggregations;
    unused_facets: string[];
}