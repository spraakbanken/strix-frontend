/* tslint:disable:no-unused-variable */

import { Store } from '@ngrx/store';

import { LocService } from './loc.service';
import { AppState } from './searchreducer';

describe('Service: Loc', () => {
  let appStateStore: Store<AppState>;

  beforeEach(() => {
    appStateStore = <Store<AppState>>{
      select : a => ({
        filter : predicate => ({
          subscribe : next => null
        })
      })
    };
  });

  it('should ...', () => {
    const service = new LocService(appStateStore);
    expect(service).toBeTruthy();
  });

  it('can set and get language', () => {
    const service = new LocService(appStateStore);
    expect(service.getCurrentLanguage()).toBe('swe');
    service.setCurrentLanguage('eng');
    expect(service.getCurrentLanguage()).toBe('eng');
  });

  it('should translate key', () => {
    const service = new LocService(appStateStore);
    expect(service.getTranslationFor('corpus_id', 'foo'))
      .toBe('Samling');
    expect(service.getTranslationFor('foo', 'Foo'))
      .toBe('Foo');
    expect(service.getTranslationFor('foo'))
      .toBe('-missing translation-');
  });

  it('should prettify numbers', () => {
    const service = new LocService(appStateStore);
    expect(service.getPrettyNumberString(12345678))
      .toBe('12 345 678');
    expect(service.getPrettyNumberString('12345678'))
      .toBe('12 345 678');
  });

});
