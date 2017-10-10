import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/pairwise';
import { TimerObservable } from "rxjs/observable/TimerObservable";
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as _ from 'lodash';

import { INITIATE, RELOAD, OPENDOCUMENT, CLOSEDOCUMENT, POPSTATE } from './searchreducer';

/** The Routing Service is responsible for keeping the web browser URL and 
   the ngrx-store app store in sync. It is the only piece of code that is allowed
   to change the browser's URL, and components should only communicate with this
   service by dispatching to the ngrx store. */

interface AppState {
  searchRedux: any;
}

enum FragmentType {
  STRING, STRINGARRAY, NUMBER, BASE64, BOOLEAN, URI
}

@Injectable()
export class RoutingService {

  private searchRedux: Observable<any>;
  
  private readonly urlFields = [
    {tag : "corpora", type : FragmentType.STRINGARRAY, default : []},
    {tag : "type", type : FragmentType.STRING, default : "normal"},
    {tag : "query", type : FragmentType.URI, default : ""},
    {tag : "localQuery", type : FragmentType.STRING, default : ""},
    {tag : "page", type : FragmentType.NUMBER, default : 1},
    {tag : "filters", type : FragmentType.BASE64, default : {}},
    {tag : "include_facets", type : FragmentType.STRINGARRAY, default : []},
    {tag : "keyword_search", type : FragmentType.BOOLEAN, default : false},
    {tag : "documentID", type : FragmentType.STRING, default : ""},
    {tag : "documentCorpus", type : FragmentType.STRING, default : ""},
    {tag : "lang", type : FragmentType.STRING, default : "swe"} // TODO: Get default from some config
  ];

  constructor(private store: Store<AppState>) {
    this.searchRedux = this.store.select('searchRedux');
    this.initializeStartingParameters();

    // window.onpopstate = (event) => {
    let prevState = null
    Observable.fromEvent(window, "popstate").map(() => {
      // console.log("popstate", "location: " + document.location + ", state: " + JSON.stringify(event.state));
      let currentState = this.getCurrentState()
      console.log("currentState", currentState)
      // this.initializeStartingParameters()

      // this.store.dispatch({ type : POPSTATE, payload : currentState});
      let ret = [currentState, prevState];
      prevState = currentState
      return ret
      
    }).subscribe( ([current, prev] ) => {
      console.log("current, prev", current, prev)

      if(!current.documentID) {
        this.store.dispatch({
          type : CLOSEDOCUMENT
        });

      }


    })


    this.searchRedux.subscribe((data) => {
      console.log("the data", data);
      let urlString = _.compact(this.urlFields.map((field) => {
        let key = field.tag
        let val = this.stringify(field.type, data[field.tag])
        if(!val || val === this.stringify(field.type, field.default)) {
          return ""
        }
        return `${encodeURI(key)}=${encodeURI(val)}`;
      })).join("&");
      if(urlString) {
        urlString = "?" + urlString
      }
      if(data.latestAction !== INITIATE) {
        window.history.pushState("", "", urlString)
      }
    });

  }


  private stringify(type: FragmentType, obj): string {
    if (!obj) return "";
    switch (type) {
      case FragmentType.STRING:
        return obj;
      case FragmentType.URI:
        return obj;
      case FragmentType.STRINGARRAY:
        return obj.join(",");
      case FragmentType.NUMBER:
        return obj.toString();
      case FragmentType.BOOLEAN:
        return obj.toString();
      case FragmentType.BASE64:
        return btoa(JSON.stringify(obj));
    }
  }

  private destringify(type: FragmentType, str: string): any {
    switch (type) {
      case FragmentType.STRING:
        return str;
      case FragmentType.URI:
        return decodeURIComponent(str);
      case FragmentType.STRINGARRAY:
        return str.split(",");
      case FragmentType.NUMBER:
        return parseInt(str, 10);
      case FragmentType.BASE64:
        return JSON.parse(atob(str));
      case FragmentType.BOOLEAN:
        return str === "true";
    }
  }

  private getCurrentState() {
    const urlSearch = window.location.search;
    console.log("urlSearch", urlSearch)
    let startParams = {};
    if (urlSearch && urlSearch.length > 1) {
      const urlPart = urlSearch.split("?")[1];
      startParams = _.fromPairs(urlPart.split("&").map((item) => item.split("=")));
    }
    const state = {};
    for (let field of this.urlFields) {
      const item = startParams[field.tag] ? this.destringify(field.type, startParams[field.tag]) : field.default;
      state[field.tag] = item || null;
    }
    return state
  }

  private initializeStartingParameters() {
    let startState = this.getCurrentState()
    console.log("init startState", startState)

    this.store.dispatch({ type : INITIATE, payload : startState});

    setTimeout(() => { this.store.dispatch({ type : RELOAD, payload : null}); }, 1);
    // REM: The timeout is needed to make sure the components start listening to the query streams,
    // else they will be cold and not fire.
    // There probably is a better solution for this. Maybe we can use BehaviorSubjects?

    // We need to make this "wait" for the query to be sent (NB: not *received*!)
    const timer = TimerObservable.create(0);
    timer.subscribe(() => {
      if (startState["documentID"] && startState["documentCorpus"]) {
        console.log("autoopening document", startState["documentID"], startState["documentCorpus"]);
        this.store.dispatch({
          type : OPENDOCUMENT,
          payload : {doc_id : startState["documentID"], corpus_id : startState["documentCorpus"]}
        });
      }
    });

  }

}
