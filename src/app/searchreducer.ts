import { ActionReducer, Action } from '@ngrx/store';
import * as _ from 'lodash';

export const CHANGETYPE = "CHANGETYPE";
export const CHANGESEARCHSTRING = "CHANGESEARCHSTRING";
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
        type: state.type || "normal",
        searchString : state.searchString || "",
        corpora : state.corpora || ["vivill"],
        last_type : state.last_type || "",
        last_searchString : state.last_searchString || "",
        last_corpora : state.last_corpora || [],
        last_page : state.last_page || 1,
        latestAction : action.type
    }
    switch (action.type) {
        case INITIATE:
            nextState = _.assign({}, nextState, action.payload);
            //console.log("new nextState", nextState);
            break;
        case CHANGETYPE:
            nextState.type = action.payload;
            break;
        case CHANGESEARCHSTRING:
            nextState.searchString = action.payload;
            break;
        case CHANGECORPORA:
            nextState.corpora = action.payload;
            break;
        case SEARCH:
            nextState.last_type = nextState.type;
            nextState.last_searchString = nextState.searchString;
            nextState.last_corpora = nextState.corpora;
            nextState.last_page = 1;
        case RELOAD:
            // Like search but without changing the state.
            // Used for the first load of the page.
            nextState.latestAction = "SEARCH";
            break;
    }

    return nextState;
}