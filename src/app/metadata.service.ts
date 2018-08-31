import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { CallsService } from './calls.service';
import { StrixCorpusConfig } from './strixcorpusconfig.model';

@Injectable()
export class MetadataService {

  private availableCorpora: { [key: string] : StrixCorpusConfig};
  private errorMessage : string;

  private successfulLoad = new Subject<boolean>();
  loadedMetadata$ = this.successfulLoad.asObservable();

  constructor(private callsService: CallsService) {
    this.callsService.getCorpusInfo().subscribe(
      (answer: {[key: string]: StrixCorpusConfig}) => {
        console.log("corpus configs", answer);
        this.availableCorpora = answer;
        this.successfulLoad.next(true);
      },
      error => this.errorMessage = <any>error
    );
  }

  public getAvailableCorpora() {
    return this.availableCorpora;
  }

  public getWordAnnotationsFor(corpusID: string): any[] {
    return this.availableCorpora[corpusID].wordAttributes || [];
  }

  public getStructuralAnnotationsFor(corpusID: string): any[] {
    return this.availableCorpora[corpusID].structAttributes || [];
  }
  
  public getName(corpusID: string): {[lang: string]: string} {
    return this.availableCorpora[corpusID].name;
  }

  /*
    THERE NEEDS TO BE A WAY FOR THE METADATA SERVICE TO NOTIFY ALL OTHER COMPONENTS
    THAT THE METADATA CALL HAS FINISHED SO THAT THEY CAN GET WHAT THEY WANT.
    REM: Maybe use BehaviorSubject instead?
  */

}
