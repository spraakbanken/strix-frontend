import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';

import { QueryType, StrixQuery } from './strixquery.model';
import { SearchResult, AggregationsResult } from './strixresult.model';
import { CallsService } from './calls.service';
import { Store } from '@ngrx/store';
import { CLOSEDOCUMENT, AppState } from './searchreducer';
import { StrixEvent } from './strix-event.enum';
import { filter, switchMap } from 'rxjs/operators';
import * as _ from 'lodash';

/**
 * The Query service handles the main query resulting in
 * a major state change in the GUI. It should use only
 * CallsService to do the actual calls. NO calls directly
 * through $http!
 */

@Injectable()
export class QueryService {

  private currentQuery: StrixQuery;

  /* Every query call becomes a stream in the stream of streams,
     but only the most recently added strean will actually be
     subscribed to. (I.e. all older pending streams will be unsubscribed) */
  private streamOfStreams: Subject<Observable<SearchResult>> = new Subject<Observable<SearchResult>>();
  private streamOfAggregationStreams: Subject<Observable<AggregationsResult>> = new Subject<Observable<AggregationsResult>>();

  // The searchResult$ stream delivers the actual results after a finished search
  private searchResultSubject = new Subject<SearchResult>();
  searchResult$ = this.searchResultSubject.asObservable();

  // The aggregationResult$ stream delivers the aggregated results after a finished aggregation search
  private aggregationResultSubject = new Subject<AggregationsResult>();
  aggregationResult$ = this.aggregationResultSubject.asObservable();

  // Components should subscribe to the searchStatus$ stream
  // to know the *status* of the search (for displaying such 
  // things as progress bars):
  // REM: searchStatusSubject needs to be a BehaviorSubject
  // so that any subscribing components can get the latest 
  // state directly upon subscribing.
  private searchStatusSubject = new BehaviorSubject<StrixEvent>(StrixEvent.INIT);
  searchStatus$ = this.searchStatusSubject.asObservable();

  constructor(private callsService: CallsService,
              private store: Store<AppState>) {
    this.onInit();
  }

  public getSearchString(): string {
    if (this.currentQuery && this.currentQuery.queryString) {
      return this.currentQuery.queryString;
    } else {
      return null;
    }
  }

  public getInOrderFlag(): boolean {
    if (this.currentQuery && this.currentQuery.keyword_search) {
      //let keywordSearch = this.currentQuery.keyword_search
      return false;
    } else {
      return true;
    }
    //let keywordSearch = this.currentQuery.keyword_search || false;
    //return !keywordSearch;
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

  public runCurrentQuery() {
    console.log(":runCurrentQuery", this.currentQuery);
    this.signalStartedSearch();
    this.runQuery(this.currentQuery);
    this.runAggregationQuery(this.currentQuery);
  }

  private runQuery(query: StrixQuery) {
    if (query.type === QueryType.Normal) {
      console.log("adding a search to the stream of streams");
      this.streamOfStreams.next(this.callsService.searchForString(query));
    } else {
      // ... we'll see what the future brings
    }
  }
  
  private runAggregationQuery(query: StrixQuery) {
    if (query.type === QueryType.Normal) {
      console.log("adding an aggregation search to the stream of streams");
      this.streamOfAggregationStreams.next(this.callsService.getAggregations(query));
    } else {
      // ... we'll see what the future brings
    }
  }

  onInit() {

    this.store.select('query').subscribe(data => {
    /* React upon the action SEARCH, most likely triggering a main query search. */
      const previousQuery = this.currentQuery;
      this.currentQuery = new StrixQuery();
      this.currentQuery.type = <QueryType>data.type;
      this.currentQuery.queryString = data.query;
      this.currentQuery.pageIndex = data.page;
      this.currentQuery.documentsPerPage = 10; // TODO: Make non hardcoded
      this.currentQuery.filters = data.filters;
      this.currentQuery.include_facets = data.include_facets || [];
      if(data.keyword_search) {
        this.currentQuery.keyword_search = data.keyword_search
      }
      if (!_.isEqual(this.currentQuery, previousQuery)) {
        this.runCurrentQuery(); // Perform the actual search
      }
    });

    /* Redo the last query when the user closes the open document */
    this.store.select('ui').pipe(filter(ui => ui.latestAction === CLOSEDOCUMENT)).subscribe(() => {
      if (this.currentQuery) this.runCurrentQuery(); // REM: Don't know why it's sometimes null (and only in Firefox, it seems..)
    });

    /* switchMap makes sure only the most recently added query stream is listened to.
       All other streams are unsubscribed and the $http request should, as a
       consequence be cancelled. */
    this.streamOfStreams.pipe(switchMap(obj => obj)).subscribe( (value: SearchResult) => {
      this.signalEndedSearch();
      this.searchResultSubject.next(value);
    });
    this.streamOfAggregationStreams.pipe(switchMap(obj => obj)).subscribe((value: AggregationsResult) => {
      this.aggregationResultSubject.next(value);
    });
  }

}
