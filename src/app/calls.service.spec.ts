/* tslint:disable:no-unused-variable */

import { Http } from '@angular/http';

import { CallsService } from './calls.service';
import { LocService } from './loc.service';

describe('Service: Calls', () => {
  let http: Http;
  let locService: LocService;

  beforeEach(() => {
    http = jasmine.createSpyObj('Http', []);
    locService = jasmine.createSpyObj('LocService', ['getTranslationFor', 'getCurrentLanguage']);
  });

  it('instantiate', () => {
    let callsService = new CallsService(http, locService);
    expect(callsService).toBeTruthy();
  });
});
