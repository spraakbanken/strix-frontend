import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name : 'prettynumber'})
export class PrettynumberPipeStub implements PipeTransform {
  transform(v, d?) {
    return String('prettynumber:' + v);
  }
}
