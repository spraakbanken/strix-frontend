import { ActionReducer, Action } from '@ngrx/store';
import * as _ from 'lodash';

export const CHANGETYPE = "CHANGETYPE";
export const CHANGENEXTQUERY = "CHANGENEXTQUERY";
export const CHANGECORPORA = "CHANGECORPORA";
export const SEARCH = "SEARCH";
export const RELOAD = "RELOAD";
export const INITIATE = "INITIATE";

/** This is an ngrx-store reducer which takes the current search state
 *  and returns a new state while performing an 'action'.
 *  The state is always immutable!
 */


export function searchReducer(state: any = {}, action: Action) {
    let nextState = {
        nextType: state.nextType || "normal",
        nextQuery : state.nextQuery || "",
        nextCorpora : state.nextCorpora || ["vivill"],
        type : state.type || "",
        query : state.query || "",
        corpora : state.corpora || [],
        page : state.page || 1,
        latestAction : action.type
    }
    switch (action.type) {
        case INITIATE:
            nextState = _.assign({}, nextState, action.payload);
            //console.log("new nextState", nextState);
            break;
        case CHANGETYPE:
            nextState.nextType = action.payload;
            break;
        case CHANGENEXTQUERY:
            nextState.nextQuery = action.payload;
            break;
        case CHANGECORPORA:
            nextState.nextCorpora = action.payload;
            break;
        case SEARCH:
            nextState.type = nextState.nextType;
            nextState.query = nextState.nextQuery;
            nextState.corpora = nextState.nextCorpora;
            nextState.page = 1;
        case RELOAD:
            // Like search but without changing the state.
            // Used for the first load of the page.
            nextState.latestAction = "SEARCH";
            break;
    }

    return nextState;
}