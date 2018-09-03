// Maybe data should be more explicit, but we'll probably wait until the structure is more definite.

import { StrixDocument } from './strixdocument.model';

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
    key : string,
    selected : boolean,
    parent: string,
    doc_count : number,

    // TODO: move range props to seprate type?
    from?: number,
    to?: number
    
}

export class AggregationsResult {
  aggregations: Aggregations;
  unused_facets: string[];
}

export class SearchResult {
  data: StrixDocument[];
  count: number;
}
