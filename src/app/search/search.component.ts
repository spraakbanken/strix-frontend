import { Component, OnInit } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';

import { QueryService } from '../query.service';
import { CallsService } from '../calls.service';
import { KarpService } from '../karp.service';
import { StrixEvent } from '../strix-event.enum';
import { SEARCH, CHANGENEXTQUERY, CHANGEFILTERS, CHANGECORPORA, INITIATE } from '../searchreducer';

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

  private histogramData: any;

  private currentFilters: any[] = []; // TODO: Make some interface
  /*
    field : "fieldname",
    values : ["value1", "value2"]
  */

  private searchStatusSubscription: Subscription;
  private isSearching = false;

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

    this.searchRedux.filter((d) => d.latestAction === CHANGEFILTERS).subscribe((data) => {
      console.log("picked up filters change", data.filters);
      this.currentFilters = data.filters; // Not sure we really should overwrite the whole tree.

    });

    this.searchRedux.filter((d) => d.latestAction === CHANGECORPORA || d.latestAction === INITIATE).subscribe((data) => {
      this.callsService.getDateHistogramData(data.corpora[0]).subscribe((histogramData) => {
        this.histogramData = histogramData;
      });
    });
  }

  ngOnInit() {

  }

  private simpleSearch() {
    this.store.dispatch({ type: CHANGENEXTQUERY, payload : this.asyncSelected});
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
