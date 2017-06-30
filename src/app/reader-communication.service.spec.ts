import { TestBed, inject } from '@angular/core/testing';

import { ReaderCommunicationService } from './reader-communication.service';

describe('ReaderCommunicationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReaderCommunicationService]
    });
  });

  it('should be created', inject([ReaderCommunicationService], (service: ReaderCommunicationService) => {
    expect(service).toBeTruthy();
  }));
});
