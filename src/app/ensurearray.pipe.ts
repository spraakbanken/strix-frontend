import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
  name: 'ensurearray'
})
export class EnsurearrayPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (value === null || value === undefined) {
      return [];
    } else {
      return _.isArray(value) ? value : [value];
    }
    
  }

}
