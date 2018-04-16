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
import { SEARCH, CLOSEDOCUMENT, INIT_DATE_HISTORGRAM } from './searchreducer';
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
  private streamOfDateHistogramStreams: Subject<Observable<StrixResult>> = new Subject<Observable<StrixResult>>();

  // The searchResult$ stream delivers the actual results after a finished search
  private searchResultSubject = new Subject<any>();
  searchResult$ = this.searchResultSubject.asObservable();

  // The aggregationResult$ stream delivers the aggregated results after a finished aggregation search
  private aggregationResultSubject = new Subject<any>();
  aggregationResult$ = this.aggregationResultSubject.asObservable();
  private dateHistogramResultSubject = new BehaviorSubject<any>(null);
  dateHistogramResult$ = this.dateHistogramResultSubject.asObservable();

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
      // this.streamOfDateHistogramStreams.next(this.callsService.getDateHistogramData(query));
    } else {
      // ... we'll see what the future brings
    }
  }

  public runDatehistogramAggQuery(query: StrixQuery) {
    this.streamOfDateHistogramStreams.next(this.callsService.getDateHistogramData(query))
  }

  onInit() {

    this.searchRedux = this.store.select('searchRedux');
    /* React upon the action SEARCH, most likely triggering a main query search. */
    this.searchRedux.filter((d) => d.latestAction === SEARCH).subscribe((state) => {
      this.currentQuery = this.stateToQuery(state)
      this.runCurrentQuery(); // Perform the actual search
    });
    this.searchRedux.filter((d) => d.latestAction === INIT_DATE_HISTORGRAM).subscribe((state) => {
      let query : StrixQuery = this.stateToQuery(state)
      this.runDatehistogramAggQuery(query); 
    });

    /* Redo the last query when the user closes the open document */
    this.searchRedux.filter((d) => d.latestAction === CLOSEDOCUMENT).subscribe((data) => {
      if (this.currentQuery) this.runCurrentQuery(); // REM: Don't know why it's sometimes null (and only in Firefox, it seems..)
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
    this.streamOfDateHistogramStreams.switchMap( obj => {
      return obj;
    }).subscribe( value => {
      this.dateHistogramResultSubject.next(value);
    });
  }

  private stateToQuery(state : any) {
    let query = new StrixQuery();
    query.type = state.type;
    query.queryString = state.query;
    query.pageIndex = state.page;
    query.documentsPerPage = 10; // TODO: Make non hardcoded
    /* console.log("state.corpora", state.corpora);
    if ( state.corpora.length === 1 && state.corpora[0] === undefined) { // Because of "corpora=" in the URL
      query.corpora = []; // All corpora (default)
    } else {
      query.corpora = state.corpora;
    } */
    
    query.filters = state.filters;
    query.include_facets = state.include_facets || [];
    if(state.keyword_search) {
      query.keyword_search = state.keyword_search
    }
    return query
  }

}
