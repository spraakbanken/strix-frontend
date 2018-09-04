/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { RoutingService } from './routing.service';
import { AppState } from './searchreducer';

describe('Service: Routing', () => {
  let service: RoutingService;
  let appStateStore = <Store<AppState>>{
    select : a => new Observable(),
    dispatch : action => null,
  };

  beforeEach(() => {
    service = new RoutingService(appStateStore);
  });

  it('should ...', () => {
    expect(service).toBeTruthy();
  });
});
