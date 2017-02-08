import { Injectable } from '@angular/core';
import { Router, NavigationExtras, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as _ from 'lodash';
import { INITIATE, RELOAD } from './searchreducer';

/** The Routing Service is responsible for keeping the Angular Router and 
   the ngrx-store app store. It is the only piece of code that is allowed
   to talk to the router, and components should only communicate with this
   service by dispatching to the ngrx store. */

interface AppState {
  searchRedux: any;
}

@Injectable()
export class RoutingService {

  private searchRedux: Observable<any>;

  constructor(private router: Router,
              private store: Store<AppState>,
              private route: ActivatedRoute) {
    console.log("RoutingService constructor");
    console.log("888", this.route.snapshot);
    this.searchRedux = this.store.select('searchRedux');

    
    this.initializeStartingParameters();

    this.searchRedux.subscribe((data) => {
      console.log("state change. There is a need to update the URL accordingly!", data);
      // Maybe we should have an action URLCHANGE that get's called when manually editing the url?
      let queryParams = {
        "query" : data.last_searchString,
        "page" : data.last_page,
        "corpora" : data.last_corpora.join(","),
        "nextcorpora" : data.corpora
      };

      let navigationExtras: NavigationExtras = {
        queryParams: _.assign({}, this.router.routerState.snapshot.root.queryParams, queryParams),
        fragment: "anchor"
      };

      this.router.navigate(['/document'], navigationExtras);
    });

    this.route.queryParams.subscribe(params => {
      // MAYBE WE NEED THIS BUT PROBABLY NOT.
    });

  }

  initializeStartingParameters() {
    let urlSearch = window.location.search;
    if (urlSearch && urlSearch.length > 1) {
      let urlPart = urlSearch.split("?")[1];
      let startingParams = _.fromPairs(urlPart.split("&").map((item) => item.split("=")));
      console.log("starting params", window.location.search, startingParams);

      let startState = {
        "type" : "normal",
        "last_type" : "normal",
        "last_searchString" : startingParams["query"] || "",
        "last_page" : parseInt(startingParams["page"], 10) || 1,
        "last_corpora" : startingParams["corpora"].split(",") || [],
        "corpora" : startingParams["nextcorpora"].split(",") || ["vivill"]
      };
      console.log("startState.last_searchString", startState.last_searchString);
      this.store.dispatch({ type: INITIATE, payload : startState});
      this.store.dispatch({ type: RELOAD, payload : null});
    }
  }

}
