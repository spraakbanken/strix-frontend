import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { StrixQuery } from './strixquery.model';
import { StrixResult } from './strixresult.model';
import { CallsService } from './calls.service';
import { Store } from '@ngrx/store';

interface AppState {
  searchRedux: any;
}

/**
 * Since the creation of a search query is spread between components,
 * the query service needs to keep track of the different states of
 * the current query and notify each conserned component when something
 * changes.
 */

@Injectable()
export class QueryService {

  private currentQuery: StrixQuery;

  //private currentQuerySubject = new Subject<StrixQuery>();
  //queryChanged$ = this.currentQuerySubject.asObservable();
  private searchResultSubject = new Subject<any>();
  searchResult$ = this.searchResultSubject.asObservable();

  private searchRedux: Observable<any>;

  constructor(private callsService: CallsService,
              private store: Store<AppState>) {
    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.subscribe((data) => {
      console.log("new value", data);
      if (data.latestAction === "SEARCH") { // SEARCH shouldn't be a string but a type, right?
        // Perform the actual search.
        this.currentQuery = new StrixQuery();
        this.currentQuery.type = data.last_type;
        this.currentQuery.queryString = data.last_searchString;
        this.currentQuery.pageIndex = data.last_page;
        this.currentQuery.documentsPerPage = 10; // TODO: Make non hardcoded
        this.currentQuery.corpora = data.last_corpora; // TODO: Get all corpora as default
        this.runCurrentQuery();
      }
    });
  }

  /* A component which makes a change to the query should register it here. */
  /* public registerUpdate(): void {
    this.currentQuerySubject.next(this.currentQuery);
  } */

  /*public chooseCorpora(corporaIDs: string[]): void {
    this.currentQuery.corpora = corporaIDs;
  } */
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
  public runCurrentQuery() : void {
    //return this.runQuery(this.currentQuery);
    this.runQuery(this.currentQuery).subscribe((answer) => {
      console.log("ran query with the result", answer);
      this.searchResultSubject.next(answer);
    });
    
  }
  private runQuery(query: StrixQuery): Observable<StrixResult> {
    if (query.type === "normal") {
      console.log("should search for a text string", query.queryString);
      return this.callsService.searchForString(query);
    } else {
      // Search for an annotation
      
    }
    
  }

}
