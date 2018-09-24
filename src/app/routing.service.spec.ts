/* tslint:disable:no-unused-variable */

import { Store } from '@ngrx/store';
import { RoutingService } from './routing.service';
import { AppState } from './searchreducer';

describe('Service: Routing', () => {
  let service: RoutingService;
  let appStateStore = <Store<AppState>>{
    subscribe : () => {},
    dispatch : action => null,
  };

  beforeEach(() => {
    service = new RoutingService(appStateStore);
  });

  it('should ...', () => {
    expect(service).toBeTruthy();
  });
});
