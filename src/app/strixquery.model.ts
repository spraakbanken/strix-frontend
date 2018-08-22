export class StrixQuery {
    type: QueryType;
    queryString: string;
    corpora: string[];
    pageIndex: number; // 1-based!
    documentsPerPage: number;
    filters: Filter[];
    include_facets: string[] = [];
    keyword_search: boolean;
}

export class Filter {
    field: string;
    type?: string;
    value: any;
}

export enum QueryType {
    Normal = 'normal'
}