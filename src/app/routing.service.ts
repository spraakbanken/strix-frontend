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
   service by dispatching to the ngrx store.
   
   We should however remove the Angular router a.s.a.p. since it's too
   heavy weight and doesn't really fit our needs anyway. */

interface AppState {
  searchRedux: any;
}

@Injectable()
export class RoutingService {

  private searchRedux: Observable<any>;

  constructor(private router: Router,
              private store: Store<AppState>,
              private route: ActivatedRoute) {
    this.searchRedux = this.store.select('searchRedux');

    
    this.initializeStartingParameters();

    this.searchRedux.subscribe((data) => {
      console.log("state change. There is a need to update the URL accordingly!", data);

      let queryParams = {
        "query" : data.query,
        "page" : data.page,
        "corpora" : data.corpora.join(","),
        "nextCorpora" : data.nextCorpora
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
        "nextType" : "normal",
        "type" : "normal",
        "query" : startingParams["query"] || "",
        "page" : parseInt(startingParams["page"], 10) || 1,
        "corpora" : startingParams["corpora"].split(",") || [],
        "nextCorpora" : startingParams["nextCorpora"].split(",") || ["vivill"]
      };
      console.log("startState.query", startState.query);
      this.store.dispatch({ type: INITIATE, payload : startState});
      this.store.dispatch({ type: RELOAD, payload : null});
    }
  }

}
