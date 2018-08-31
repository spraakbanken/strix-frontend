import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name : 'loc'})
export class LocPipeStub implements PipeTransform {
  transform(v, d?) {
    return v.swe;
  }
}
