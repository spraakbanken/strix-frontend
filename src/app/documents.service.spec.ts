/* tslint:disable:no-unused-variable */

import { Store } from '@ngrx/store';
import { CallsService } from './calls.service';
import { DocumentsService } from './documents.service';
import { QueryService } from './query.service';
import { AppState } from './searchreducer';
import { Observable } from 'rxjs';

describe('Service: Documents', () => {
  let service: DocumentsService;
  let callsService = <CallsService>{};
  let queryService = <QueryService>{};
  let appStateStore = <Store<AppState>>{};

  beforeEach(() => {
    appStateStore = <Store<AppState>>{
      select : a => new Observable(),
    };

    service = new DocumentsService(callsService, queryService, appStateStore);
  });

  it('should ...', () => {
    expect(service).toBeTruthy();
  });
});
