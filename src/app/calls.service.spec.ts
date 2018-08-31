/* tslint:disable:no-unused-variable */

import { Http } from '@angular/http';

import { CallsService } from './calls.service';
import { LocService } from './loc.service';

describe('Service: Calls', () => {
  let service: CallsService;
  let http = <Http>{};
  let locService = <LocService>{};

  beforeEach(() => {
    service = new CallsService(http, locService);
  });

  it('instantiate', () => {
    expect(service).toBeTruthy();
  });
});
