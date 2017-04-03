import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';

import { CHANGELANG, INITIATE } from './searchreducer';

interface AppState {
  searchRedux: any;
}

@Injectable()
export class LocService {

  private searchRedux: Observable<any>;

  private currentLanguage : string = "swe"; // TODO: The default language should be in some config
  private dictionaries: any = {
    "swe" : {
      "swe" : "Svenska",
      "eng" : "Engelska",
      "related_documents" : "Relaterade dokument"
    },
    "eng" : {
      "swe" : "Swedish",
      "eng" : "English",
      "related_documents" : "Related documents"
    }
  };

  constructor(private store: Store<AppState>) {

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.filter((d) => d.latestAction === CHANGELANG || d.latestAction === INITIATE).subscribe((data) => {
      this.currentLanguage = data.lang;
    });

  }

  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }
  public setCurrentLanguage(isoCode: string) {
    console.log("changing language to " + isoCode);
    this.currentLanguage = isoCode;
  }
  public getTranslationFor(source: string): string {
    let term = this.dictionaries[this.currentLanguage][source];
    return term || "-missing translation-";
  }

}
