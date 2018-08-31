import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name : 'lemgram'})
export class LemgramPipeStub implements PipeTransform {
  transform(v, d?) {
    return 'lemgram:' + v;
  }
}
