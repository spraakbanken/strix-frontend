import { Injectable } from '@angular/core';
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

enum FragmentType {
  STRING, STRINGARRAY, NUMBER
}

@Injectable()
export class RoutingService {

  private searchRedux: Observable<any>;

  private readonly urlFields = [
    {tag : "corpora", type : FragmentType.STRINGARRAY, default : []},
    {tag: "type", type : FragmentType.STRING, default : ""},
    {tag : "query", type : FragmentType.STRING, default : ""},
    {tag : "page", type : FragmentType.NUMBER, default : 1},
    {tag : "nextCorpora", type : FragmentType.STRINGARRAY, default : ["vivill"]},
    {tag: "nextType", type : FragmentType.STRING, default : "normal"},
    {tag : "nextQuery", type : FragmentType.STRING, default : ""}
  ];

  constructor(private store: Store<AppState>) {
    this.searchRedux = this.store.select('searchRedux');
    this.initializeStartingParameters();

    this.searchRedux.subscribe((data) => {
      const urlString = "#?" + this.urlFields.map((field) => {
        return `${encodeURI(field.tag)}=${encodeURI(this.stringify(field.type, data[field.tag]))}`;
      }).join("&");
      window.location.hash = urlString;
    });

  }

  private stringify(type: FragmentType, obj): string {
    if (!obj) return "";
    switch (type) {
      case FragmentType.STRING:
        return obj;
      case FragmentType.STRINGARRAY:
        return obj.join(",");
      case FragmentType.NUMBER:
        return obj.toString();
    }
  }

  private destringify(type: FragmentType, str: string): any {
    switch (type) {
      case FragmentType.STRING:
        return str;
      case FragmentType.STRINGARRAY:
        return str.split(",");
      case FragmentType.NUMBER:
        return parseInt(str, 10);
    }
  }

  private initializeStartingParameters() {
    let urlHash = window.location.hash;
    let startingParams = {};
    if (urlHash && urlHash.length > 1) {
      const urlPart = urlHash.split("?")[1];
      startingParams = _.fromPairs(urlPart.split("&").map((item) => item.split("=")));
      console.log("starting params", startingParams);
    }

    const startState = {};
    for (let field of this.urlFields) {
      const item = startingParams[field.tag] ? this.destringify(field.type, startingParams[field.tag]) : field.default;
      startState[field.tag] = item || null;
    }

    this.store.dispatch({ type: INITIATE, payload : startState});

    if (startState["query"]) {
      this.store.dispatch({ type: RELOAD, payload : null});
    }

  }

}
