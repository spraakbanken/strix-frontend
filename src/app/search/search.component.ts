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

  }

  ngOnInit() {
     this.searchRedux.take(1).subscribe(data => {
      this.isPhraseSearch = !data.keyword_search

      if(data.query) {
        this.asyncSelected = data.query
      }
    }); 

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

}
