/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { LocService } from './loc.service';

describe('Service: Loc', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LocService]
    });
  });

  it('should ...', inject([LocService], (service: LocService) => {
    expect(service).toBeTruthy();
  }));
});
