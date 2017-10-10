import { PrettynumberPipe } from './prettynumber.pipe';

describe('PrettynumberPipe', () => {
  it('create an instance', () => {
    const pipe = new PrettynumberPipe();
    expect(pipe).toBeTruthy();
  });
});
