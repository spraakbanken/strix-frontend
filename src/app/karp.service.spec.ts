/* tslint:disable:no-unused-variable */

import { Http } from '@angular/http';
import { KarpService } from './karp.service';

describe('Service: Karp', () => {
  let http: Http;
  let service: KarpService;

  beforeEach(() => {
    service = new KarpService(http);
  });

  it('should ...', () => {
    expect(service).toBeTruthy();
  });
});
