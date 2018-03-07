// Maybe data should be more explicit, but we'll probably wait until the structure is more definite.

export interface Aggregations {
    [key : string] : Agg
}
export interface Agg {
    buckets : Bucket[],
    type : string,
    value : any,

    min?: number,
    max?: number,
    selected : boolean
}

export interface Bucket {
    key : any,
    selected : boolean,
    parent: string,
    doc_count : number,

    // TODO: move range props to seprate type?
    from?: number,
    to?: number,

    word_count? : number;
    
}

export class StrixResult {
    count: number;
    data: any[];
    aggregations: Aggregations;
    unused_facets: string[];
}