import { ActionReducer, Action } from '@ngrx/store';
import * as _ from 'lodash';
import {StrixQuery} from './strixquery.model';
import { Doc } from 'codemirror';

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
  query: QueryState;
  document: DocumentState;
  ui: UiState;
}

export interface QueryState {
  type?: string;
  query?: string;
  filters?;
  include_facets?: string[];
  keyword_search?;
  page?: number;
}

export interface DocumentState {
  open?: boolean;
  documentID?: string;
  documentCorpus?: string;
  localQuery?: string;
  sentenceID?: number;
}

export interface UiState {
  lang?: string;
  latestAction?: string;
  history?: boolean;
}

export type SearchRedux = any


export function queryStateReducer(state: QueryState = {}, action: Action): QueryState {
  let nextState: QueryState = {...state};
  switch (action.type) {
    case CHANGEQUERY:
      nextState.query = action.payload;
      nextState.page = 1;
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
    case SEARCH:
      nextState.page = 1;
      break;
  }
  return nextState;
}

export function documentStateReducer(state: DocumentState, action: Action): DocumentState {
  let nextState: DocumentState = {...state};
  switch (action.type) {
    case OPENDOCUMENT:
    case OPENDOCUMENT_NOHISTORY:
      nextState.documentID = action.payload.doc_id;
      nextState.documentCorpus = action.payload.corpus_id;
      break;
    case CLOSEDOCUMENT:
    case CLOSEDOCUMENT_NOHISTORY:
      nextState.documentID = null;
      nextState.documentCorpus = null;
      nextState.localQuery = null;
      nextState.sentenceID = null;
      break;
  }
  return nextState;
}

export function uiStateReducer(state: UiState = {}, action: Action): UiState {
  let nextState: UiState = {
    ...state,
    latestAction : action.type,
    history : true,
  };
  switch (action.type) {
    case INITIATE:
      console.log("INITIATE.");
      nextState = _.assign({}, nextState, action.payload);
      nextState.history = false;
      break;
    case CHANGELANG:
      nextState.lang = action.payload;
      break;
    case OPENDOCUMENT_NOHISTORY:
    case CLOSEDOCUMENT_NOHISTORY:
      nextState.history = false;
      nextState.latestAction = CLOSEDOCUMENT;
      break;
    case SEARCHINDOCUMENT:
      nextState.latestAction = "OPENDOCUMENT";
      break;
    case SEARCH:
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
