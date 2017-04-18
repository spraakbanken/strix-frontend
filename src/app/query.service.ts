import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { StrixQuery } from './strixquery.model';
import { StrixResult } from './strixresult.model';
import { CallsService } from './calls.service';
import { Store } from '@ngrx/store';
import { SEARCH } from './searchreducer';
import { StrixEvent } from './strix-event.enum';

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

  // The searchResult$ stream delivers results after a
  // finished search:
  private searchResultSubject = new Subject<any>();
  searchResult$ = this.searchResultSubject.asObservable();

  // Components should subscribe to the searchStatus$ stream
  // to know the *status* of the search (for displaying such 
  // things as progress bars):
  // REM: searchStatusSubject needs to be a BehaviorSubject
  // so that any subscribing components may get the latest 
  // state directly upon subscribing.
  private searchStatusSubject = new BehaviorSubject<StrixEvent>(StrixEvent.INIT);
  searchStatus$ = this.searchStatusSubject.asObservable();

  private searchRedux: Observable<any>;

  constructor(private callsService: CallsService,
              private store: Store<AppState>) {
    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.filter((d) => {console.log("d", d); return d.latestAction === SEARCH}).subscribe((data) => {
      console.log("new value", data);
      // Perform the actual search.
      this.currentQuery = new StrixQuery();
      this.currentQuery.type = data.type;
      this.currentQuery.queryString = data.query;
      this.currentQuery.pageIndex = data.page;
      this.currentQuery.documentsPerPage = 10; // TODO: Make non hardcoded
      this.currentQuery.corpora = data.corpora; // TODO: Get all corpora as default
      this.currentQuery.filters = data.filters;
      console.log("this.currentQuery", this.currentQuery);
      this.runCurrentQuery();
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

  private signalStartedSearch() {
    this.searchStatusSubject.next(StrixEvent.SEARCHSTART);
  }
  private signalEndedSearch() {
    this.searchStatusSubject.next(StrixEvent.SEARCHEND);
  }

  /* The actual calls */
  public runCurrentQuery() : void {
    //return this.runQuery(this.currentQuery);
    this.signalStartedSearch();
    this.runQuery(this.currentQuery).subscribe((answer) => {
      console.log("ran query with the result", answer);
      this.signalEndedSearch();
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
