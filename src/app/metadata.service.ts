import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';

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
      answer => {
        console.log("corpus configs", answer);
        this.availableCorpora = answer;

        // Temp workaround because the BE returns the structural attributes
        // as dictionary so we need to make an array for consistency.
        /* for (let corpus in this.availableCorpora) {
          let attList = [];
          for (let attributeKey in this.availableCorpora[corpus].structAttributes) {
            attList.push({
              attributes : this.availableCorpora[corpus].structAttributes[attributeKey],
              name : attributeKey
            });
          }
          this.availableCorpora[corpus].structAttributes = attList;
        } */
        // end of temp fix
        for (let corpus in this.availableCorpora) {
          let attList = [];
          for (let attributeKey in this.availableCorpora[corpus].structAttributes) {
            attList.push({
              attributes : this.availableCorpora[corpus].structAttributes[attributeKey].attributes,
              name : attributeKey
            });
          }
          this.availableCorpora[corpus].structAttributes = attList;
        }

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
