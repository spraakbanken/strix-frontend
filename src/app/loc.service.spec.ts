/* tslint:disable:no-unused-variable */

import { Store } from '@ngrx/store';

import { LocService } from './loc.service';
import { AppState, INITIATE } from './searchreducer';
import { Subject } from 'rxjs';

describe('Service: Loc', () => {
  let service: LocService;
  let appStateStore: Store<AppState>;
  let searchRedux = new Subject<AppState>();

  beforeEach(() => {
    appStateStore = <Store<AppState>>{
      select : a => searchRedux,
    };

    service = new LocService(appStateStore);
  });

  it('should ...', () => {
    expect(service).toBeTruthy();
  });

  it('can set and get language', () => {
    service.setCurrentLanguage('eng');
    expect(service.getCurrentLanguage()).toBe('eng');
  });

  it('set language on init', () => {
    searchRedux.next({searchRedux : {latestAction : INITIATE, lang : 'ger'}});
    searchRedux.subscribe(() => {
      expect(service.getCurrentLanguage()).toBe('ger');
    });
  });

  it('should translate key', () => {
    service.setCurrentLanguage('swe');
    expect(service.getTranslationFor('corpus_id', 'foo'))
      .toBe('Samling');
    expect(service.getTranslationFor('bar', 'foo'))
      .toBe('foo');
    expect(service.getTranslationFor('bar'))
      .toBe('-missing translation-');
  });

  it('should prettify numbers', () => {
    service.setCurrentLanguage('swe');
    expect(service.getPrettyNumberString(12345678))
      .toBe('12 345 678');
    expect(service.getPrettyNumberString('12345678'))
      .toBe('12 345 678');
    service.setCurrentLanguage('eng');
    expect(service.getPrettyNumberString(12345678))
      .toBe('12,345,678');
  });

});
