import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { StrixQuery } from './strixquery.model';
import { StrixResult } from './strixresult.model';
import { CallsService } from './calls.service';

/**
 * Since the creation of a search query is spread between components,
 * the query service needs to keep track of the different states of
 * the current query and notify each conserned component when something
 * changes.
 */

@Injectable()
export class QueryService {

  private currentQuery: StrixQuery;

  private currentQuerySubject = new Subject<StrixQuery>();
  queryChanged$ = this.currentQuerySubject.asObservable();

  constructor(private callsService: CallsService) {
    this.currentQuery = new StrixQuery();
    this.currentQuery.type = "textsträng";
    this.currentQuery.pageIndex = 1;
    this.currentQuery.documentsPerPage = 10; // TODO: Make non hardcoded
    this.currentQuery.corpora = ["vivill"]; // TODO: Get all corpora as default
  }

  /* A component which makes a change to the query should register it here. */
  public registerUpdate(): void {
    this.currentQuerySubject.next(this.currentQuery);
  }

  public chooseCorpora(corporaIDs: string[]): void {
    this.currentQuery.corpora = corporaIDs;
  }
  public getSearchString(): string {
    return this.currentQuery.queryString;
  }
  public setSearchString(searchString: string): void {
    this.currentQuery.queryString = searchString;
  }
  public setPage(page: number): void {
    this.currentQuery.pageIndex = page;
  }

  /* The actual calls */
  public runCurrentQuery(): Observable<StrixResult> {
    return this.runQuery(this.currentQuery);
  }
  private runQuery(query: StrixQuery): Observable<StrixResult> {
    if (query.type === "textsträng") {
      console.log("should search for a text string", query.queryString);
      return this.callsService.searchForString(query);
    } else {
      // Search for an annotation
      
    }
    
  }

}
