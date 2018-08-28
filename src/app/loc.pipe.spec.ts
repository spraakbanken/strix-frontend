/* tslint:disable:no-unused-variable */

import { LocPipe } from './loc.pipe';
import { LocService } from './loc.service';

describe('Pipe: Loc', () => {
  let locServiceSwe: LocService;
  let locServiceEng: LocService;

  beforeEach(() => {
    locServiceSwe = <LocService>{
      getTranslationFor: (v, d) => 'Samling',
      getCurrentLanguage: () => 'swe',
    };
    locServiceEng = <LocService>{
      getTranslationFor: (v, d) => 'Collection',
      getCurrentLanguage: () => 'eng',
    };
  });

  it('create an instance', () => {
    let pipe = new LocPipe(locServiceSwe);
    expect(pipe).toBeTruthy();
  });

  it('should translate key', () => {
    let pipe = new LocPipe(locServiceSwe);
    expect(pipe.transform('corpus_id'))
      .toBe('Samling');

    pipe = new LocPipe(locServiceEng);
    expect(pipe.transform('corpus_id'))
      .toBe('Collection');
  });

  it('should translate object', () => {
    let pipe = new LocPipe(locServiceSwe);
    expect(pipe.transform({'swe' : 'Samling', 'eng' : 'Collection'}))
      .toBe('Samling');

    pipe = new LocPipe(locServiceEng);
    expect(pipe.transform({'swe' : 'Samling', 'eng' : 'Collection'}))
      .toBe('Collection');
  });
});
