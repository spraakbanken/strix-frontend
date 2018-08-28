/* tslint:disable:no-unused-variable */

import { LocService } from './loc.service';
import { PrettynumberPipe } from './prettynumber.pipe';

describe('Pipe: Prettynumber', () => {
  let locServiceSwe: LocService;
  let locServiceEng: LocService;

  beforeEach(() => {
    locServiceSwe = <LocService>{
      getPrettyNumberString: v => '1 234',
    };
    locServiceEng = <LocService>{
      getPrettyNumberString: v => '1,234',
    };
  });

  it('should prettify numbers', () => {
    let pipe = new PrettynumberPipe(locServiceSwe);
    expect(pipe.transform('foo'))
      .toBe('1 234');

    pipe = new PrettynumberPipe(locServiceEng);
    expect(pipe.transform('foo'))
      .toBe('1,234');
  });
});
