import { Component, OnInit } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import 'rxjs/add/operator/take';
import * as _ from 'lodash';
import * as moment from "moment";

import { QueryService } from '../query.service';
import { CallsService } from '../calls.service';
import { KarpService } from '../karp.service';
import { StrixEvent } from '../strix-event.enum';
import { SEARCH, CHANGEQUERY, CHANGEFILTERS, INITIATE, CHANGE_IN_ORDER } from '../searchreducer';

interface AppState {
  searchRedux: any;
}

@Component({
  selector: 'search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  private searchRedux: Observable<any>;
  
  private searchableAnnotations: string[] = ["lemgram", "betydelse"];
  private searchType = "normal"; // TODO: Have something else than the string

  private asyncSelected: string = "";
  private dataSource: Observable<any>;
  private errorMessage: string;

  private currentFilters: any[] = [];

  private histogramData: any;
  private histogramSelection: any;

  private fromYear: number;
  private toYear: number;

  // private changeDates(dates: any) {
  //   this.fromYear = moment(dates.from*1000).year();
  //   this.toYear = moment(dates.to*1000).year();
  //   this.updateInterval();
  // };

  // private updateInterval() {
  //   console.log("new interval", this.fromYear + "-" + this.toYear);
  //   let isSet = false;
  //   let value = {"range" : {"gte" : this.fromYear, "lte" : this.toYear}};
  //   console.log("currentFilter*", this.currentFilters.length);
  //   for (let currentFilter of this.currentFilters) {
  //     console.log("currentFilter*", currentFilter);
  //     if (currentFilter.field === "datefrom") {
  //       currentFilter.values = [value];
  //       isSet = true;
  //     }
  //   }
  //   if (!isSet) {
  //     this.currentFilters.push({"field" : "datefrom", "values" : [value]});
  //   }
  //   this.updateFilters();
  // }

  /*
    field : "fieldname",
    values : ["value1", "value2"]
  */

  private searchStatusSubscription: Subscription;
  private isSearching = false;
  private isPhraseSearch : boolean = true;

  constructor(private callsService: CallsService,
              private karpService: KarpService,
              private queryService: QueryService,
              private store: Store<AppState>) {
    this.searchRedux = this.store.select('searchRedux');

    this.searchStatusSubscription = queryService.searchStatus$.subscribe(
      answer => {
        console.log("search status:", answer);
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

    this.dataSource = Observable.create((observer:any) => {
      // Runs on every autocompletion search
      observer.next(this.asyncSelected);
    }).mergeMap((token: string) => this.karpService.lemgramsFromWordform(this.asyncSelected));


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
     this.searchRedux.take(1).subscribe(data => {
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

  private searchTypeChange(val) {
    console.log("searchTypeChange", val)
    this.store.dispatch({type : CHANGE_IN_ORDER, payload: !val})
  }

  private simpleSearch() {
    this.store.dispatch({ type: CHANGEQUERY, payload : this.asyncSelected});
    this.store.dispatch({ type: SEARCH, payload : null});
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

  // private purgeFilter(aggregationKey: string) {
  //   for (let i = 0; i < this.currentFilters.length; i++) {
  //     if (this.currentFilters[i].field === aggregationKey) {
  //       this.currentFilters.splice(i, 1);
  //       break;
  //     }
  //   }
  //   this.updateFilters();
  // }

  // private updateFilters() {
  //   this.store.dispatch({ type: CHANGEFILTERS, payload : this.currentFilters});
  //   this.store.dispatch({ type: SEARCH, payload : null});
  // }

}
