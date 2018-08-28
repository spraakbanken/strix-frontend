import { PrettynumberPipe } from './prettynumber.pipe';
import { LocService } from './loc.service';

describe('PrettynumberPipe', () => {
  let locService: LocService;

  beforeEach(() => {
    locService = jasmine.createSpyObj('LocService', ['getTranslationFor', 'getCurrentLanguage']);
  });

  it('create an instance', () => {
    const pipe = new PrettynumberPipe(locService);
    expect(pipe).toBeTruthy();
  });
});
