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
    /*this.callsService.getCorpora().subscribe(
      answer => {
        console.log("the answer", answer);
        this.availableCorpora = answer;
        this.callsService.getCorpusInfo(this.availableCorpora).subscribe(
          answer => {
            console.log("corpus configs", answer);
             this.successfulLoad.next(true);
          },
          error => this.errorMessage = <any>error
        );
      },
      error => this.errorMessage = <any>error
    );*/
    this.callsService.getCorpusInfo().subscribe(
      answer => {
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

  /*
    THERE NEEDS TO BE A WAY FOR THE METADATA SERVICE TO NOTIFY ALL OTHER COMPONENTS
    THAT THE METADATA CALL HAS FINISHED SO THAT THEY CAN GET WHAT THEY WANT.
    REM: Maybe use BehaviorSubject instead?
  */

}
