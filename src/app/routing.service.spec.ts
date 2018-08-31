/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { RoutingService } from './routing.service';
import { AppState } from './searchreducer';

describe('Service: Routing', () => {
  let service: RoutingService;
  let appStateStore = <Store<AppState>>{
    select : a => new Observable(noop),
    dispatch : action => null,
  };

  function noop() {}

  beforeEach(() => {
    service = new RoutingService(appStateStore);
  });

  it('should ...', () => {
    expect(service).toBeTruthy();
  });
});
