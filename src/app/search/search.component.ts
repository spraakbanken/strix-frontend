import { Component, OnInit } from '@angular/core';
import { Observable, Observer, Subscription, Subject } from 'rxjs';
import { take, mergeMap, switchMap, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as moment from "moment";

import { QueryService } from '../query.service';
import { CallsService } from '../calls.service';
import { KarpService } from '../karp.service';
import { StrixEvent } from '../strix-event.enum';
import { SEARCH, CHANGEQUERY, CHANGEFILTERS, CHANGE_IN_ORDER, AppState, SearchRedux, CLOSEDOCUMENT, MODE_SELECTED, VECTOR_SEARCH, SELECTED_CORPORA, VECTOR_SEARCH_BOX } from '../searchreducer';
import { Filter, QueryType } from '../strixquery.model';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { AppComponent } from 'app/app.component';
import * as _ from 'lodash';

@Component({
  selector: 'search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  public myControl = new FormControl();

  private searchRedux: Observable<SearchRedux>;

  private searchableAnnotations: string[] = ["lemgram", "betydelse"];
  public searchType = QueryType.Normal;

  private asyncSelected: string = '';
  private asyncSelectedV: string = '';
  private dataSource: Observable<any>;
  private errorMessage: string;

  public currentFilters: Filter[] = [];

  public karpResult = [];
  public showHits = false;
  public valueChanged: Subject<string> = new Subject<string>();

  public selectSearch = 'Search tokens';
  public selectedOption = 'Search phrase';

  public vectorSearch = false;

  private histogramData: any;
  private histogramSelection: any;

  private fromYear: number;
  private toYear: number;

  private changeDates(dates: any) {
    this.fromYear = moment(dates.from*1000).year();
    this.toYear = moment(dates.to*1000).year();
    this.updateInterval();
  };

  private updateInterval() {
    // console.log("new interval", this.fromYear + "-" + this.toYear);
    let isSet = false;
    let value = {"range" : {"gte" : this.fromYear, "lte" : this.toYear}};
    // console.log("currentFilter*", this.currentFilters.length);
    for (let currentFilter of this.currentFilters) {
      // console.log("currentFilter*", currentFilter);
      if (currentFilter.field === "datefrom") {
        currentFilter.value = value;
        isSet = true;
      }
    }
    if (!isSet) {
      this.currentFilters.push({"field" : "datefrom", "value" : value});
    }
    this.updateFilters();
  }

  /*
    field : "fieldname",
    values : ["value1", "value2"]
  */

  private searchStatusSubscription: Subscription;
  public isSearching = false;
  public isPhraseSearch : boolean = false;
  private isInitialPart : boolean = false;
  private isMiddlePart : boolean = false;
  private isFinalPart : boolean = false;
  private isCaseSensitive : boolean = false;
  public selectedCorpora: string[];

  constructor(private callsService: CallsService,
              private karpService: KarpService,
              private queryService: QueryService,
              private appComponent: AppComponent,
              private store: Store<AppState>) {
    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.pipe(filter((d) => d.latestAction === CLOSEDOCUMENT)).subscribe((data) => {
      this.isPhraseSearch = !data.keyword_search;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === SELECTED_CORPORA)).subscribe((data) => {
      this.selectedCorpora = data.corporaInMode;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === VECTOR_SEARCH_BOX)).subscribe((data) => {
      this.asyncSelectedV = data.vectorQuery;
      this.vectorSearch = data.vectorSearchbox
    })

    this.searchRedux.pipe(filter((d) => d.latestAction === MODE_SELECTED)).subscribe((data) => {
      // this.isPhraseSearch = !data.keyword_search;
      this.asyncSelected = '';
      this.asyncSelectedV = '';
      this.isPhraseSearch = true;
      this.store.dispatch({ type: CHANGE_IN_ORDER, payload : !this.isPhraseSearch});
      this.store.dispatch({ type: CHANGEQUERY, payload : this.asyncSelected});
      // this.store.dispatch({ type: SEARCH, payload : null});
        // this.simpleSearch();
    });

    this.searchStatusSubscription = queryService.searchStatus$.subscribe(
      (answer: StrixEvent) => {
        // console.log("search status:", answer);
        switch (answer) { // TODO: Create an enum for this. Or a union type?
          case StrixEvent.SEARCHSTART:
            this.isSearching = true;
            break;
          case StrixEvent.SEARCHEND:
            this.isSearching = false;
            break;
        }
      },
      error => this.errorMessage = <any>error
    );

    this.dataSource = Observable.create((observer: Observer<any>) => {
      // Runs on every autocompletion search
      observer.next(this.asyncSelected);
    }).pipe(mergeMap((token: string) => this.karpService.lemgramsFromWordform(this.asyncSelected)));

    this.valueChanged
      .pipe(debounceTime(1000), switchMap(changedValue => this.karpService.lemgramsFromWordform(changedValue)))
      .subscribe(value => {
        this.karpResult = value;
        // console.log(value);
      })

    this.myControl.valueChanges.pipe(
      debounceTime(2000),
      switchMap(changedValue => this.karpService.lemgramsFromWordform(changedValue)),
   ).subscribe((karpResult) => {
    this.karpResult = karpResult;
    if (this.karpResult.length > 0) {
      this.showHits = true;
    } else {
      this.showHits = false;
    }
   }
    );

    // this.searchRedux.filter((d) => d.latestAction === CHANGEFILTERS).subscribe(({ filters }) => {
    //   console.log("picked up filters change", filters);

    //   this.currentFilters = filters; // Not sure we really should overwrite the whole tree.
    //   let didFilter = false;
    //   for (let filter of this.currentFilters) {
    //     if (filter.field === "datefrom") {
    //       didFilter = true;
    //       let gte = filter.values[0].range.gte;
    //       let lte = filter.values[0].range.lte;
    //       console.log("control it 1", gte, lte, this.fromYear, this.toYear);
    //       if (gte !== this.fromYear || lte !== this.toYear) {
    //         console.log("control it 2");
    //         this.histogramSelection = {"from" : moment(gte+"", "YYYY"), "to" : moment(lte+"", "YYYY")};
    //       }
    //     }
    //   }
    //   if (! didFilter) {
    //     this.histogramSelection = {"from" : undefined, "to" : undefined};
    //   }
    // });
  }

  ngOnInit() {
     this.searchRedux.pipe(take(1)).subscribe(data => {
      // this.getHistogramData(data.corpora);
      this.isPhraseSearch = !data.keyword_search

      if(data.query) {
        this.asyncSelected = data.query
      }
    });

    /* this.searchRedux.filter((d) => d.latestAction === CHANGECORPORA).subscribe((data) => {
      console.log("acting upon", data.latestAction);
      this.getHistogramData(data.corpora);
    }); */
  }

  public searchTypeChange(val) {
    // console.log("searchTypeChange", val)
    this.store.dispatch({type : CHANGE_IN_ORDER, payload: !val})
  }

  public searchVectorMode(val) {
    // console.log("searchVectorMode", val, this.vectorSearch)
    this.store.dispatch({type : VECTOR_SEARCH_BOX, payload: !val})
    // if (!val) {
    //   this.clearSimpleSearch();
    // }
  }

  private clearSimpleSearch() {
    this.asyncSelected = '';
    this.simpleSearch();
    // this.store.dispatch({type : CHANGE_IN_ORDER, payload: !val})
  }

  private onChangeEvent(event: any) {
    if (event.target.value.length > 0) {
      this.valueChanged.next(event.target.value);
    } else {
      this.karpResult = [];
    }
  }

  public changeSearchType(item) {
    if (item === 'Search phrase') {
      this.isPhraseSearch = false;
      this.store.dispatch({type : CHANGE_IN_ORDER, payload: !this.isPhraseSearch})
    } else {
      this.isPhraseSearch = true;
      this.store.dispatch({type : CHANGE_IN_ORDER, payload: !this.isPhraseSearch})
    }
  }

  private getHistogramData(corpora: string[]) {
    // console.log("getting histogram data.");
    this.callsService.getDateHistogramData(corpora[0]).subscribe((histogramData) => {
      this.histogramData = histogramData;
      // console.log("got histogram data", histogramData);
    });
  }

  public simpleSearch() {
    if (this.vectorSearch) {
      this.appComponent.selectedTabV.setValue(0);
      this.store.dispatch({type : VECTOR_SEARCH, payload: {'vc': this.vectorSearch, '_query': this.asyncSelectedV}})
    } else {
      if (this.asyncSelected.includes('""') || this.asyncSelected.includes('" "')) {
        this.isPhraseSearch = true;
        this.store.dispatch({ type: CHANGE_IN_ORDER, payload : !this.isPhraseSearch});
      } else if (this.asyncSelected[0] === '"' && this.asyncSelected.charAt(this.asyncSelected.length -1) === '"') {
        this.isPhraseSearch = true;
        this.store.dispatch({ type: CHANGE_IN_ORDER, payload : !this.isPhraseSearch});
      } else if (this.asyncSelected === '') {
        this.isPhraseSearch = true;
        this.store.dispatch({ type: CHANGE_IN_ORDER, payload : !this.isPhraseSearch});
      } else {
        this.isPhraseSearch = false;
        this.store.dispatch({ type: CHANGE_IN_ORDER, payload : !this.isPhraseSearch});
      }
      // this.store.dispatch({type : VECTOR_SEARCH, payload: this.vectorSearch})
      this.store.dispatch({ type: CHANGEQUERY, payload : this.asyncSelected});
      this.store.dispatch({ type: SEARCH, payload : null});
    }
  }

  /* This should read from the current query (in the query-service)
     and update this component's GUI accordingly. */
  private updateGUIFromCurrentQuery() {
    this.asyncSelected = this.queryService.getSearchString();
  }

  private typeaheadOnSelect(event) {
    console.log("Selected something with the event", event);
  }

  public toggled(open: boolean): void {
    console.log('Dropdown is now: ', open);
  }

  private purgeFilter(aggregationKey: string) {
    for (let i = 0; i < this.currentFilters.length; i++) {
      if (this.currentFilters[i].field === aggregationKey) {
        this.currentFilters.splice(i, 1);
        break;
      }
    }
    this.updateFilters();
  }

  private updateFilters() {
    this.store.dispatch({ type: CHANGEFILTERS, payload : this.currentFilters});
    this.store.dispatch({ type: SEARCH, payload : null});
  }

}
