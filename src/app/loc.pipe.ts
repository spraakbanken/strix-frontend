import { Pipe, PipeTransform } from '@angular/core';
import { LocService } from './loc.service';

@Pipe({
  name: 'loc',
  pure: false
})
export class LocPipe implements PipeTransform {

  constructor(private locService: LocService) {}
  
  transform(value: any, args?: any): any {
    if (typeof value === "string") {
      /*
        It's a simple string. Translate it according to the GUI dictionary.
      */
      return this.locService.getTranslationFor(value);
    } else {
      /*
        It's an object with this structure:
          {
            "swe" : "translated text",
            "eng" : "translated text",
            [...]
          }
        We pick the translated text for the current language.
      */
      let currentLanguage = this.locService.getCurrentLanguage();
      return value[currentLanguage];
    }
    
  }

}