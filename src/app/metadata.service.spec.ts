/* tslint:disable:no-unused-variable */

import { CallsService } from './calls.service';
import { MetadataService } from './metadata.service';
import { StrixCorpusConfig } from './strixcorpusconfig.model';

describe('Service: Metadata', () => {
  let service: MetadataService;
  let callsService = <CallsService>{
    // Ctor will call getCorpusInfo and subscribe a handler to the result. Store that handler so we can invoke it.
    getCorpusInfo : () => ({
      subscribe : (next, error) => {
        callsServiceInit = next;
      },
    }),
  };
  let callsServiceInit: (value: {[key: string]: StrixCorpusConfig}) => void;

  const sampleCorpusConfigs: {[key: string]: StrixCorpusConfig} = {
    corp : new StrixCorpusConfig('corp', [],
      [{name : 'pos'}],
      [{name : 'sentence', attributes : {name : 'speaker_id'}}],
      {swe : 'A nice corpus'}, {swe : 'NiceCorpus'}),
  };

  beforeEach(() => {
    service = new MetadataService(callsService);
  });

  it('should be initiated with corpus info', () => {
    callsServiceInit(sampleCorpusConfigs);
    expect(service).toBeTruthy();
    expect(service.getAvailableCorpora()).toEqual(sampleCorpusConfigs);
    expect(service.getName('corp')).toEqual({swe : 'NiceCorpus'});
  });

  it('should handle word annotations', () => {
    callsServiceInit(sampleCorpusConfigs);
    expect(service.getWordAnnotationsFor('corp')).toEqual([{name : 'pos'}]);
  });

  it('should handle structural annotations', () => {
    callsServiceInit(sampleCorpusConfigs);
    expect(service.getStructuralAnnotationsFor('corp')).toEqual([{name : 'sentence', attributes : {name : 'speaker_id'}}]);
  });

});
