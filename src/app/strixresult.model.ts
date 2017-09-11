// Maybe data should be more explicit, but we'll probably wait until the structure is more definite.

export interface Aggregations {
    [key : string] : ({[buckets : string] : Bucket[]})
}

export interface Bucket {
    key : string,
    selected : boolean,
    parent: string,
    doc_count : number
}

export class StrixResult {
    count: number;
    data: any[];
    aggregations: Aggregations;
    unused_facets: string[];
}