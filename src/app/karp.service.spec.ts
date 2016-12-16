/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { KarpService } from './karp.service';

describe('Service: Karp', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KarpService]
    });
  });

  it('should ...', inject([KarpService], (service: KarpService) => {
    expect(service).toBeTruthy();
  }));
});
