import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'lemgram'
})
export class LemgramPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    const parts = value.split(".");
    return `${parts[0]} (${parts[2]})`;
  }

}
