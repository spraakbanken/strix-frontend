/* tslint:disable:no-unused-variable */

import { Store } from '@ngrx/store';
import { CallsService } from './calls.service';
import { DocumentsService } from './documents.service';
import { QueryService } from './query.service';
import { AppState } from './searchreducer';

describe('Service: Documents', () => {
  let service: DocumentsService;
  let callsService = <CallsService>{};
  let queryService = <QueryService>{};
  let appStateStore = <Store<AppState>>{};

  beforeEach(() => {
    appStateStore = <Store<AppState>>{
      select : a => ({
        filter : predicate => ({
          subscribe : next => null
        })
      })
    };

    service = new DocumentsService(callsService, queryService, appStateStore);
  });

  it('should ...', () => {
    expect(service).toBeTruthy();
  });
});
