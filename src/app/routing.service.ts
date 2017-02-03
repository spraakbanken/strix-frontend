import { Injectable } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';

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
              private store: Store<AppState>) {
    console.log("RoutingService constructor");
    this.searchRedux = this.store.select('searchRedux');

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
  }

}
