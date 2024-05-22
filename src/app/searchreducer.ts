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
export const MODE_SELECTED = "MODE_SELECTED";
export const SELECTED_CORPORA = "SELECTED_CORPORA";
export const DOC_SIZE = "DOC_SIZE";
export const WORD_COUNT = "WORD_COUNT";
export const YEAR_RANGE = "YEAR_RANGE";
export const YEAR_INTERVAL = "YEAR_INTERVAL";
export const UNDEFINED_YEAR = "UNDEFINED_YEAR";
export const YEAR_NA = "YEAR_NA";
export const FACET_LIST = "FACET_LIST";
export const VECTOR_SEARCH = "VECTOR_SEARCH";
export const VECTOR_SEARCH_BOX = "VECTOR_SEARCH_BOX";

//
export const HIGHLIGHT_PARALLEL = "HIGHLIGHT_PARALLEL";
export const HIGHLIGHT_SOURCE = "HIGHLIGHT_SOURCE";
export const REFERENCE_ID = "REFERENCE_ID";
//

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
  documentsPerPage?: number;
  query?: string;
  type?: string;
  sentenceID?: number;
  modeSelected?: string[];
  corporaInMode?: string[];
  preSelect?: string[];
  modeStatus?: string;
  selectedCorpora?: string[];
  docSize?: string;
  yearInterval?: string;
  yearRoot?: string;
  wordCount?: number[];
  yearRange?: number[];
  undefinedYear?: boolean;
  yearNA?: boolean;
  facet_list?;
  emptySelection?: string;
  vectorSearch?;
  vectorQuery?: string;
  vectorSearchbox?;

  //
  highlightParallel ?: string[];
  highlightSource ?: string[];
  reference_id ?: string;
  reference_corpus ?: string;
  //
}


/** This is an ngrx-store reducer which takes the current search state
 *  and returns a new state while performing an 'action'.
 *  The state is always immutable!
 */

export function searchReducer(state: SearchRedux = {}, action: Action): SearchRedux {
  // console.log("reducing with action", action.type, action.payload);
  let nextState: SearchRedux = _.assign({}, state);
  nextState.latestAction = action.type;
  nextState.history = true; // Default value
  switch (action.type) {
    case INITIATE:
      // console.log("INITIATE.");
      nextState = _.assign({}, nextState, action.payload);
      nextState.emptySelection = "";
      nextState.history = false;
      break;
    case CHANGEQUERY:
      nextState.query = action.payload;
      nextState.page = 0
      break;
    case CHANGEFILTERS:
      nextState.filters = action.payload;
      nextState.page = 0
      break;
    case CHANGE_INCLUDE_FACET:
      nextState.include_facets = action.payload;
      break;
    case CHANGE_IN_ORDER:
      nextState.keyword_search = action.payload;
      break;
    case CHANGEPAGE:
      nextState.page = action.payload.pageIndex;
      nextState.documentsPerPage = action.payload.pageSize;
      break;
    case CHANGELANG:
      nextState.lang = action.payload;
      break;
    case MODE_SELECTED:
      nextState.modeSelected = action.payload.mode;
      nextState.corporaInMode = action.payload.corpuses;
      nextState.preSelect = action.payload.preSelect;
      nextState.modeStatus = action.payload.modeStatus;
      nextState.filters = {};
      nextState.docSize = '';
      nextState.yearInterval = '';
      nextState.selectedCorpora = [];
      break;
    case SELECTED_CORPORA:
      nextState.selectedCorpora = action.payload;
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
      nextState.reference_id = null;
      nextState.reference_corpus = null;
      break;
    case CLOSEDOCUMENT_NOHISTORY:
      nextState.documentID = null;
      nextState.documentCorpus = null;
      nextState.localQuery = null;
      nextState.sentenceID = null;
      nextState.reference_id = null;
      nextState.reference_corpus = null;
      nextState.history = false;
      nextState.latestAction = CLOSEDOCUMENT;
      break;
    case SEARCHINDOCUMENT:
      nextState.localQuery = action.payload;
      break;
    case SEARCH:
      nextState.page = 0;
      nextState.localQuery = null;
      nextState.history = false;
      // nextState.documentsPerPage = 10;
      break;
    case RELOAD:
      // Like search but without changing the state.
      // Used for the first load of the page.
      nextState.latestAction = "SEARCH";
      nextState.history = false;
      // nextState.documentsPerPage = 10;
      break;
    case DOC_SIZE:
      nextState.docSize = action.payload;
      break;
    case YEAR_INTERVAL:
      nextState.yearInterval = action.payload.getInterval;
      nextState.yearRoot = action.payload.getRoot;
      break;
    case WORD_COUNT:
      nextState.wordCount = action.payload;
      break;
    case YEAR_RANGE:
      nextState.yearRange = action.payload;
      break;
    case UNDEFINED_YEAR:
      nextState.undefinedYear = action.payload;
      break;
    case YEAR_NA:
      nextState.yearNA = action.payload;
      break;
    case FACET_LIST:
      nextState.facet_list = action.payload;
      break;
    case VECTOR_SEARCH:
      nextState.vectorSearch = action.payload.vc;
      nextState.vectorQuery = action.payload._query;
      break;
    case VECTOR_SEARCH_BOX:
      nextState.vectorSearchbox = action.payload;
      break;
    //
    case HIGHLIGHT_PARALLEL:
      nextState.highlightParallel = action.payload;
      break;
    case HIGHLIGHT_SOURCE:
      nextState.highlightSource = action.payload;
      break;
    case REFERENCE_ID:
      nextState.reference_id = action.payload.id;
      nextState.reference_corpus = action.payload.corpus_ref;
      break;
    //
  }

  return nextState;
}
