/* tslint:disable:no-unused-variable */

import { CallsService } from './calls.service';
import { MetadataService } from './metadata.service';
import { StrixCorpusConfig } from './strixcorpusconfig.model';

describe('Service: Metadata', () => {
  let callsService: CallsService;
  let init: (any) => void;
  const sampleCorpusConfigs: {[key: string]: StrixCorpusConfig} = {
    'corp' : new StrixCorpusConfig('corp', [],
      [{'name' : 'pos'}],
      [{'name' : 'sentence', 'attributes' : {'name' : 'speaker_id'}}],
      {'swe' : 'A nice corpus'}, {'swe' : 'NiceCorpus'}),
  };

  beforeEach(() => {
    callsService = <CallsService>{
      // Ctor will call getCorpusInfo and subscribe a handler to the result. Store that handler so we can invoke it.
      getCorpusInfo : () => ({
        subscribe : (next, error) => {
          init = next;
        },
      }),
    }
  });

  it('should be initiated with corpus info', () => {
    const service = new MetadataService(callsService);
    init(sampleCorpusConfigs);
    expect(service).toBeTruthy();
    expect(service.getAvailableCorpora()).toBe(sampleCorpusConfigs);
    expect(service.getName('corp')).toBe({'swe' : 'NiceCorpus'});
  });

  it('should handle word annotations', () => {
    const service = new MetadataService(callsService);
    init(sampleCorpusConfigs);
    expect(service.getWordAnnotationsFor('corp')).toBe([{'name' : 'pos'}]);
  });

  it('should handle structural annotations', () => {
    const service = new MetadataService(callsService);
    init(sampleCorpusConfigs);
    expect(service.getStructuralAnnotationsFor('corp')).toBe([{'name' : 'sentence', 'attributes' : {'name' : 'speaker_id'}}]);
  });



});
