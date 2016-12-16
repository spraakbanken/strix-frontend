export class StrixQuery {
    type: string; // TODO: Shouldn't be string
    queryString: string;
    corpora: string[];
    pageIndex: number; // 1-based!
    documentsPerPage: number;
}