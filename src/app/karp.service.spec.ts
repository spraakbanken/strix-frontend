/* tslint:disable:no-unused-variable */

import { HttpClient } from '@angular/common/http';
import { KarpService } from './karp.service';

describe('Service: Karp', () => {
  let http: HttpClient;
  let service: KarpService;

  beforeEach(() => {
    service = new KarpService(http);
  });

  it('should ...', () => {
    expect(service).toBeTruthy();
  });
});
