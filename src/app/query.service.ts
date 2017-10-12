import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMapTo';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/observable/timer';
import { StrixQuery } from './strixquery.model';
import { StrixResult } from './strixresult.model';
import { CallsService } from './calls.service';
import { Store } from '@ngrx/store';
import { SEARCH, CLOSEDOCUMENT } from './searchreducer';
import { StrixEvent } from './strix-event.enum';

interface AppState {
  searchRedux: any;
}

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
  private streamOfStreams: Subject<Observable<StrixResult>> = new Subject<Observable<StrixResult>>();
  private streamOfAggregationStreams: Subject<Observable<StrixResult>> = new Subject<Observable<StrixResult>>();

  // The searchResult$ stream delivers the actual results after a finished search
  private searchResultSubject = new Subject<any>();
  searchResult$ = this.searchResultSubject.asObservable();

  // The aggregationResult$ stream delivers the aggregated results after a finished aggregation search
  private aggregationResultSubject = new Subject<any>();
  aggregationResult$ = this.aggregationResultSubject.asObservable();

  // Components should subscribe to the searchStatus$ stream
  // to know the *status* of the search (for displaying such 
  // things as progress bars):
  // REM: searchStatusSubject needs to be a BehaviorSubject
  // so that any subscribing components can get the latest 
  // state directly upon subscribing.
  private searchStatusSubject = new BehaviorSubject<StrixEvent>(StrixEvent.INIT);
  searchStatus$ = this.searchStatusSubject.asObservable();

  private searchRedux: Observable<any>;

  constructor(private callsService: CallsService,
              private store: Store<AppState>) {
    this.onInit();
  }

  public getSearchString(): string {
    return this.currentQuery.queryString;
  }

  public getInOrderFlag(): boolean {
    let keywordSearch = this.currentQuery.keyword_search || false;
    return !keywordSearch;
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
    console.log(":runCurrentQuery");
    this.signalStartedSearch();
    this.runQuery(this.currentQuery);
    this.runAggregationQuery(this.currentQuery);
  }

  private runQuery(query: StrixQuery) {
    if (query.type === "normal") {
      console.log("adding a search to the stream of streams");
      this.streamOfStreams.next(this.callsService.searchForString(query));
    } else {
      // ... we'll see what the future brings
    }
  }
  
  private runAggregationQuery(query: StrixQuery) {
    if (query.type === "normal") {
      console.log("adding an aggregation search to the stream of streams");
      this.streamOfAggregationStreams.next(this.callsService.getAggregations(query));
    } else {
      // ... we'll see what the future brings
    }
  }

  onInit() {

    this.searchRedux = this.store.select('searchRedux');
    /* React upon the action SEARCH, most likely triggering a main query search. */
    this.searchRedux.filter((d) => d.latestAction === SEARCH).subscribe((data) => {
      this.currentQuery = new StrixQuery();
      this.currentQuery.type = data.type;
      this.currentQuery.queryString = data.query;
      this.currentQuery.pageIndex = data.page;
      this.currentQuery.documentsPerPage = 10; // TODO: Make non hardcoded
      /* console.log("data.corpora", data.corpora);
      if ( data.corpora.length === 1 && data.corpora[0] === undefined) { // Because of "corpora=" in the URL
        this.currentQuery.corpora = []; // All corpora (default)
      } else {
        this.currentQuery.corpora = data.corpora;
      } */
      
      this.currentQuery.filters = data.filters;
      this.currentQuery.include_facets = data.include_facets || [];
      if(data.keyword_search) {
        this.currentQuery.keyword_search = data.keyword_search
      }
      this.runCurrentQuery(); // Perform the actual search
    });

    /* Redo the last query when the user closes the open document */
    this.searchRedux.filter((d) => d.latestAction === CLOSEDOCUMENT).subscribe((data) => {
      this.runCurrentQuery();
    });

    /* switchMap makes sure only the most recently added query stream is listened to.
       All other streams are unsubscribed and the $http request should, as a
       consequence be cancelled. */
    this.streamOfStreams.switchMap( obj => {
      return obj;
    }).subscribe( value => {
      this.signalEndedSearch();
      this.searchResultSubject.next(value);
    });
    this.streamOfAggregationStreams.switchMap( obj => {
      return obj;
    }).subscribe( value => {
      this.aggregationResultSubject.next(value);
    });
  }

}
