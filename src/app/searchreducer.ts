import { ActionReducer, Action } from '@ngrx/store';
import * as _ from 'lodash';

export const CHANGETYPE = "CHANGETYPE";
export const CHANGENEXTQUERY = "CHANGENEXTQUERY";
export const CHANGENEXTTYPE = "CHANGENEXTQUERY";
export const CHANGECORPORA = "CHANGECORPORA";
export const CHANGEFILTERS = "CHANGEFILTERS";
export const CHANGEPAGE = "CHANGEPAGE";
export const OPENDOCUMENT = "OPENDOCUMENT";
export const CLOSEDOCUMENT = "CLOSEDOCUMENT";
export const SEARCH = "SEARCH";
export const RELOAD = "RELOAD";
export const INITIATE = "INITIATE";
export const CHANGELANG = "CHANGELANG";
export const SEARCHINDOCUMENT = "SEARCHINDOCUMENT";

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
    case CHANGETYPE:
      nextState.nextType = action.payload;
      break;
    case CHANGENEXTQUERY:
      nextState.nextQuery = action.payload;
      break;
    case CHANGECORPORA:
      nextState.corpora = action.payload;
      //nextState.nextCorpora = action.payload;
      break;
    case CHANGEFILTERS:
      nextState.filters = action.payload;
      break;
    case CHANGEPAGE:
      nextState.page = action.payload;
      break;
    case CHANGELANG:
      nextState.lang = action.payload;
      break;
    case OPENDOCUMENT:
      nextState.documentID = action.payload.doc_id;
      nextState.documentCorpus = action.payload.corpus;
      break;
    case CLOSEDOCUMENT:
      nextState.documentID = null;
      nextState.documentCorpus = null;
      break;
    case SEARCHINDOCUMENT:
      console.log("RUNNING SEARCHINDOCUMENT");
      nextState.type = "LOCAL"
      nextState.query = action.payload;
      nextState.latestAction = "OPENDOCUMENT";
      break;
    case SEARCH:
      nextState.type = nextState.nextType;
      nextState.query = nextState.nextQuery;
      //nextState.corpora = nextState.nextCorpora;
      nextState.page = 1;
      break;
    case RELOAD:
      // Like search but without changing the state.
      // Used for the first load of the page.
      nextState.latestAction = "SEARCH";
      break;
  }

  return nextState;
}