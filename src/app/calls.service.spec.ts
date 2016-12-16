/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { CallsService } from './calls.service';

describe('Service: Calls', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CallsService]
    });
  });

  it('should ...', inject([CallsService], (service: CallsService) => {
    expect(service).toBeTruthy();
  }));
});
