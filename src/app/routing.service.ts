import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, timer, fromEvent } from 'rxjs';
import * as _ from 'lodash';

import { INITIATE, RELOAD, OPENDOCUMENT_NOHISTORY, CLOSEDOCUMENT_NOHISTORY, AppState, SearchRedux, CHANGEQUERY } from './searchreducer';
import { QueryType } from './strixquery.model';

/** The Routing Service is responsible for keeping the web browser URL and
   the ngrx-store app store in sync. It is the only piece of code that is allowed
   to change the browser's URL, and components should only communicate with this
   service by dispatching to the ngrx store. */

enum FragmentType {
  STRING, STRINGARRAY, NUMBER, BASE64, BOOLEAN, URI
}

@Injectable()
export class RoutingService {

  private searchRedux: Observable<SearchRedux>;

  private readonly urlFields: {tag: string, type: FragmentType, default: any}[] = [
    {tag : "type", type : FragmentType.STRING, default : QueryType.Normal}, // TODO: Not in SearchRedux.
    {tag : "query", type : FragmentType.URI, default : ""},
    {tag : "localQuery", type : FragmentType.STRING, default : ""},
    {tag : "page", type : FragmentType.NUMBER, default : 0},
    {tag : "documentsPerPage", type : FragmentType.NUMBER, default : 10},
    {tag : "filters", type : FragmentType.BASE64, default : {}},
    {tag : "include_facets", type : FragmentType.STRINGARRAY, default : ["corpus_id"]},
    {tag : "modeSelected", type : FragmentType.STRINGARRAY, default : ["default"]},
    {tag : "keyword_search", type : FragmentType.BOOLEAN, default : false},
    {tag : "documentID", type : FragmentType.STRING, default : ""},
    {tag : "sentenceID", type : FragmentType.STRING, default : ""},
    {tag : "documentCorpus", type : FragmentType.STRING, default : ""},
    {tag : "lang", type : FragmentType.STRING, default : "swe"} // TODO: Get default from some config
  ];

  constructor(private store: Store<AppState>) {
    this.searchRedux = this.store.select('searchRedux');
    this.initializeStartingParameters();

    // React on app state changes by pushing a new browser state.
    // Set the encoded app state as the URL query string.
    this.searchRedux.subscribe((state: SearchRedux) => {
      // console.log("the data", state);
      let urlString = '?' + _.compact(this.urlFields.map((field) => {
        const val = this.stringify(field.type, state[field.tag]);
        if(!val || val === this.stringify(field.type, field.default)) {
          return ""
        }
        return `${encodeURI(field.tag)}=${encodeURI(val)}`;
      })).join("&");
      if (state.latestAction !== INITIATE) {
        if (state.history) {
          // console.log("PUSHING STATE")
          const referrer = location.search
          window.history.pushState("", "", urlString)
          ;(window as any)._paq.push(['setReferrerUrl', referrer], ['setCustomUrl', urlString])
          ;(window as any)._paq.push(state.latestAction === CHANGEQUERY ? ['trackSiteSearch', state.query] : ['trackPageView'])
        } else {
          window.history.replaceState("", "", urlString)
        }

      }
    });

    // On browser back button, reload state from URL query string.
    fromEvent(window, "popstate").subscribe(() => {
      this.initializeStartingParameters();
    });
  }

  private encodeFilter(obj: string): string {
    let _1 = "";
    let _2 = {};
    let _3 = [];
    for (let i = 0; i < obj.length; i++) {
      if (_.keys(_2).includes(obj[i]['field'])) {
        _2[obj[i]['field']].push(obj[i]['value'])
      } else {
        _2[obj[i]['field']] = [obj[i]['value']]
        _3.push(obj[i]['field'])
      }
    }
    for (let i = 0; i < _3.length; i++) {
      _1 += _3[i]
      _1 += ":" + _2[_3[i]].join(",")
      if (i !== _3.length -1) {
        _1 += ";"
      }
    }
    return _1;
  }

  private stringify(type: FragmentType, obj): string {
    if (!obj) return "";
    switch (type) {
      case FragmentType.STRINGARRAY:
        return obj.join(",");
      case FragmentType.BASE64:
        // return btoa(JSON.stringify(obj));
        return this.encodeFilter(obj);
      default:
        return String(obj);
    }
  }

  private decodeFilter(str: string): any {
    let _1 = str.split(";");
    let _2 = {};
    let _3 = 0;
    for (let i in _1) {
      for (let j of _1[i].split(":")[1].split(",")) {
        _2[_3] = {'field': _1[i].split(":")[0], 'value': j}
        _3++;
      }
    }
    return _2;
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
        // return JSON.parse(atob(str));
        return this.decodeFilter(str);
      case FragmentType.BOOLEAN:
        return str === "true";
    }
  }

  public getCurrentState(): SearchRedux {
    const urlSearch: string = window.location.search;
    // console.log("urlSearch", urlSearch)
    let startParams = {};
    if (urlSearch && urlSearch.length > 1) {
      const urlPart = urlSearch.split("?")[1];
      startParams = _.fromPairs(urlPart.split("&").map((item) => item.split("=")));
    }
    const state: object = {};
    for (const field of this.urlFields) {
      const item = startParams[field.tag] ? this.destringify(field.type, startParams[field.tag]) : field.default;
      state[field.tag] = item || null;
    }
    return state
  }

  private initializeStartingParameters(): void {
    const startState = this.getCurrentState();
    // console.log("init startState", startState)

    this.store.dispatch({ type : INITIATE, payload : startState});

    setTimeout(() => { this.store.dispatch({ type : RELOAD, payload : null}); }, 1);
    // REM: The timeout is needed to make sure the components start listening to the query streams,
    // else they will be cold and not fire.
    // There probably is a better solution for this. Maybe we can use BehaviorSubjects?

    // We need to make this "wait" for the query to be sent (NB: not *received*!)
    // timer(0).subscribe(() => {
    //   if ((startState.documentID || startState.sentenceID) && startState.documentCorpus) {
    //     console.log("autoopening document", startState.documentID, startState.documentCorpus);
    //     this.store.dispatch({
    //       type : OPENDOCUMENT_NOHISTORY,
    //       payload : {
    //         doc_id : startState["documentID"],
    //         sentence_id : startState["sentenceID"],
    //         corpus_id : startState["documentCorpus"]
    //       }
    //     });
    //   } else {
    //     //this.documentsService.closeMainDocument();
    //     this.store.dispatch({
    //       type : CLOSEDOCUMENT_NOHISTORY,
    //     });
    //   }
    // });

  }

}
