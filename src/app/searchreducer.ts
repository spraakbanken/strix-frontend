import { ActionReducer, Action } from '@ngrx/store';
import * as _ from 'lodash';
import {StrixQuery} from './strixquery.model';

export const CHANGEQUERY = "CHANGEQUERY";
export const CHANGEFILTERS = "CHANGEFILTERS";
export const CHANGE_INCLUDE_FACET = "CHANGE_INCLUDE_FACET";
export const CHANGEPAGE = "CHANGEPAGE";
export const OPENDOCUMENT = "OPENDOCUMENT";
export const OPENDOCUMENT_NOHISTORY = "OPENDOCUMENT_NOHISTORY";
export const CLOSEDOCUMENT = "CLOSEDOCUMENT";
export const CLOSEDOCUMENT_NOHISTORY = "CLOSEDOCUMENT_NOHISTORY";
export const SEARCH = "SEARCH";
export const RELOAD = "RELOAD";
export const INITIATE = "INITIATE";
export const CHANGELANG = "CHANGELANG";
export const SEARCHINDOCUMENT = "SEARCHINDOCUMENT";
export const CHANGE_IN_ORDER = "CHANGE_IN_ORDER";

// payload was removed from Action in lib, brought it back.
declare module '@ngrx/store' {
  interface Action {
    type: string;
    payload?: any;
  }
}

export interface AppState {
  // TODO: Group props from SearchRedux directly in here?
  // E.g. search : {query, keyword_search}, so SearchComponent can do store.select('search')
  searchRedux: SearchRedux;
}

export interface SearchRedux {
  documentCorpus?: string;
  documentID?: string;
  filters?;
  include_facets?: string[];
  keyword_search?;
  lang?: string;
  latestAction?: string;
  localQuery?: string;
  history?: boolean;
  page?: number;
  query?: string;
  type?: string;
  sentenceID?: number;
}


/** This is an ngrx-store reducer which takes the current search state
 *  and returns a new state while performing an 'action'.
 *  The state is always immutable!
 */

export function searchReducer(state: SearchRedux = {}, action: Action): SearchRedux {
  console.log("reducing with action", action.type, action.payload);
  let nextState: SearchRedux = _.assign({}, state);
  nextState.latestAction = action.type;
  nextState.history = true; // Default value
  switch (action.type) {
    case INITIATE:
      console.log("INITIATE.");
      nextState = _.assign({}, nextState, action.payload);
      nextState.history = false;
      break;
    case CHANGEQUERY:
      nextState.query = action.payload;
      nextState.page = 1
      break;
    case CHANGEFILTERS:
      nextState.filters = action.payload;
      break;
    case CHANGE_INCLUDE_FACET:
      nextState.include_facets = action.payload;
      break;
    case CHANGE_IN_ORDER:
      nextState.keyword_search = action.payload;
      break;
    case CHANGEPAGE:
      nextState.page = action.payload;
      break;
    case CHANGELANG:
      nextState.lang = action.payload;
      break;
    case OPENDOCUMENT:
      nextState.documentID = action.payload.doc_id;
      nextState.documentCorpus = action.payload.corpus_id;
      break;
    case OPENDOCUMENT_NOHISTORY:
      nextState.documentID = action.payload.doc_id;
      nextState.documentCorpus = action.payload.corpus_id;
      nextState.history = false;
      nextState.latestAction = OPENDOCUMENT;
      break;
    case CLOSEDOCUMENT:
      nextState.documentID = null;
      nextState.documentCorpus = null;
      nextState.localQuery = null;
      nextState.sentenceID = null;
      break;
    case CLOSEDOCUMENT_NOHISTORY:
      nextState.documentID = null;
      nextState.documentCorpus = null;
      nextState.localQuery = null;
      nextState.sentenceID = null;
      nextState.history = false;
      nextState.latestAction = CLOSEDOCUMENT;
      break;
    case SEARCHINDOCUMENT:
      nextState.localQuery = action.payload;
      break;
    case SEARCH:
      nextState.page = 1;
      nextState.localQuery = null;
      nextState.history = false;
      break;
    case RELOAD:
      // Like search but without changing the state.
      // Used for the first load of the page.
      nextState.latestAction = "SEARCH";
      nextState.history = false;
      break;
  }

  return nextState;
}
