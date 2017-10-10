import { Pipe, PipeTransform } from '@angular/core';
import { LocService } from './loc.service';

@Pipe({
  name: 'prettynumber',
  pure: false
})
export class PrettynumberPipe implements PipeTransform {

  constructor(private locService: LocService) {}

  transform(value: any, args?: any): any {
    return this.locService.getPrettyNumberString(value);
  }

}
