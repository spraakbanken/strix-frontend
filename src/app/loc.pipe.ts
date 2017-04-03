import { Pipe, PipeTransform } from '@angular/core';
import { LocService } from './loc.service';

@Pipe({
  name: 'loc',
  pure: false
})
export class LocPipe implements PipeTransform {

  constructor(private locService: LocService) {}
  
  transform(value: any, args?: any): any {
    //console.log("doing a transformation");
    return this.locService.getTranslationFor(value);
  }

}
