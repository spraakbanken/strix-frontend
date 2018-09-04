/* tslint:disable:no-unused-variable */

import { HttpClient } from '@angular/common/http';

import { CallsService } from './calls.service';
import { LocService } from './loc.service';

describe('Service: Calls', () => {
  let service: CallsService;
  let http = <HttpClient>{};
  let locService = <LocService>{};

  beforeEach(() => {
    service = new CallsService(http, locService);
  });

  it('instantiate', () => {
    expect(service).toBeTruthy();
  });
});
