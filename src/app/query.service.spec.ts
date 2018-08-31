/* tslint:disable:no-unused-variable */

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { CallsService } from './calls.service';
import { QueryService } from './query.service';
import { AppState } from './searchreducer';

describe('Service: Query', () => {
  let service: QueryService;
  let callsService = <CallsService>{};
  let appStateStore = <Store<AppState>>{
    select : a => new Observable(noop),
  };

  function noop() {}

  beforeEach(() => {
    service = new QueryService(callsService, appStateStore);
  });

  it('should ...', () => {
    expect(service).toBeTruthy();
  });
});
