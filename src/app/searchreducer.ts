import { ActionReducer, Action } from '@ngrx/store';
import * as _ from 'lodash';

export const CHANGETYPE = "CHANGETYPE";
export const CHANGEQUERY = "CHANGEQUERY";
export const CHANGEFILTERS = "CHANGEFILTERS";
export const CHANGE_INCLUDE_FACET = "CHANGE_INCLUDE_FACET";
export const CHANGEPAGE = "CHANGEPAGE";
export const OPENDOCUMENT = "OPENDOCUMENT";
export const CLOSEDOCUMENT = "CLOSEDOCUMENT";
export const SEARCH = "SEARCH";
export const RELOAD = "RELOAD";
export const INITIATE = "INITIATE";
export const CHANGELANG = "CHANGELANG";
export const SEARCHINDOCUMENT = "SEARCHINDOCUMENT";
export const POPSTATE = "POPSTATE";
export const CHANGE_IN_ORDER = "CHANGE_IN_ORDER";


/** This is an ngrx-store reducer which takes the current search state
 *  and returns a new state while performing an 'action'.
 *  The state is always immutable!
 */

export function searchReducer(state: any = {}, action: Action) {
  console.log("reducing with action", action.type, action.payload);
  let nextState = _.assign({}, state);
  nextState.latestAction = action.type;
  switch (action.type) {
    case INITIATE:
      console.log("INITIATE.");
      nextState = _.assign({}, nextState, action.payload);
      break;
    case CHANGEQUERY:
      nextState.query = action.payload;
      nextState.page = 1
      break;
    case CHANGETYPE:
      nextState.type = action.payload;
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
    case CLOSEDOCUMENT:
      nextState.documentID = null;
      nextState.documentCorpus = null;
      nextState.localQuery = null;
      nextState.sentenceID = null;
      break;
    case SEARCHINDOCUMENT:
      nextState.localQuery = action.payload;
      nextState.latestAction = "OPENDOCUMENT";
      break;
    case SEARCH:
      //nextState.type = nextState.nextType;
      //nextState.query = nextState.nextQuery;
      //nextState.corpora = nextState.nextCorpora;
      nextState.page = 1;
      nextState.localQuery = null;
      break;
    case RELOAD:
      // Like search but without changing the state.
      // Used for the first load of the page.
      nextState.latestAction = "SEARCH";
      break;
  }

  return nextState;
}