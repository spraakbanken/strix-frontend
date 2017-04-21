import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { TimerObservable } from "rxjs/observable/TimerObservable";
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as _ from 'lodash';

import { INITIATE, RELOAD, OPENDOCUMENT } from './searchreducer';

/** The Routing Service is responsible for keeping the web browser URL and 
   the ngrx-store app store in sync. It is the only piece of code that is allowed
   to change the browser's URL, and components should only communicate with this
   service by dispatching to the ngrx store. */

interface AppState {
  searchRedux: any;
}

enum FragmentType {
  STRING, STRINGARRAY, NUMBER, BASE64
}

@Injectable()
export class RoutingService {

  private searchRedux: Observable<any>;

  private readonly urlFields = [
    {tag : "corpora", type : FragmentType.STRINGARRAY, default : []},
    {tag : "type", type : FragmentType.STRING, default : ""},
    {tag : "query", type : FragmentType.STRING, default : ""},
    {tag : "page", type : FragmentType.NUMBER, default : 1},
    {tag : "nextCorpora", type : FragmentType.STRINGARRAY, default : [""]},
    {tag : "nextType", type : FragmentType.STRING, default : "normal"},
    {tag : "nextQuery", type : FragmentType.STRING, default : ""},
    {tag : "filters", type : FragmentType.BASE64, default : {}},
    {tag : "documentID", type : FragmentType.STRING, default : ""},
    {tag : "documentCorpus", type : FragmentType.STRING, default : ""},
    {tag : "lang", type : FragmentType.STRING, default : "swe"} // TODO: Get default from some config
  ];

  constructor(private store: Store<AppState>) {
    this.searchRedux = this.store.select('searchRedux');
    this.initializeStartingParameters();

    this.searchRedux.subscribe((data) => {
      console.log("the data", data);
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
      case FragmentType.BASE64:
        return btoa(JSON.stringify(obj));
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
      case FragmentType.BASE64:
        return JSON.parse(atob(str));
    }
  }

  private initializeStartingParameters() {
    const urlHash = window.location.hash;
    let startParams = {};
    if (urlHash && urlHash.length > 1) {
      const urlPart = urlHash.split("?")[1];
      startParams = _.fromPairs(urlPart.split("&").map((item) => item.split("=")));
      console.log("starting params", startParams);
    }

    const startState = {};
    for (let field of this.urlFields) {
      const item = startParams[field.tag] ? this.destringify(field.type, startParams[field.tag]) : field.default;
      startState[field.tag] = item || null;
    }

    this.store.dispatch({ type : INITIATE, payload : startState});

    if (startState["query"]) {
      this.store.dispatch({ type : RELOAD, payload : null});
    }

    // We need to make this "wait" for the query to be sent (NB: not *received*!)
    const timer = TimerObservable.create(0);
    timer.subscribe(() => {
      if (startState["documentID"] && startState["documentCorpus"]) {
        console.log("autoopening document", startState["documentID"], startState["documentCorpus"]);
        this.store.dispatch({
          type : OPENDOCUMENT,
          payload : {es_id : startState["documentID"], corpus : startState["documentCorpus"]}
        });
      }
    });

  }

}
