export class StrixQuery {
    type: QueryType;
    queryString: string;
    corpora: string[];
    modes: string[];
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
    Normal = 'normal',
    Lemgram = 'lemgram',
}

/**
 * Node for to-do item
 */
 export class TodoItemNode {
    children: TodoItemNode[];
    item: string;
  }
  
  /** Flat to-do item node with expandable and level information */
  export class TodoItemFlatNode {
    item: string;
    level: number;
    expandable: boolean;
  }
  
