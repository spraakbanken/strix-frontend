import { ActionReducer, Action } from '@ngrx/store';

export const CHANGETYPE = "CHANGETYPE";
export const CHANGESEARCHSTRING = "CHANGESEARCHSTRING";
export const CHANGECORPORA = "CHANGECORPORA";
export const SEARCH = "SEARCH";

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
            break;
    }

    return nextState;
}