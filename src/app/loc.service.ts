import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';

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
      "related_documents" : "Relaterade dokument",
      "search_document" : "Sök i dokumentet",
      'hits' : "Sökträffar",
      'textattributes' : "Textattribut",
      'corpus_id' : 'Samling',
      'keyword_search' : "Nyckelordssökning",
      'THOUSANDS_SEPARATOR' : " "
    },
    "eng" : {
      "swe" : "Swedish",
      "eng" : "English",
      "related_documents" : "Related documents",
      "search_document" : "Search current document",
      'hits' : "Hits",
      'textattributes' : "Text attributes",
      'corpus_id' : 'Collection',
      'keyword_search' : "Keyword search",
      'THOUSANDS_SEPARATOR' : ","
    }
  };

  constructor(private store: Store<AppState>) {

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.filter((d) => d.latestAction === CHANGELANG || d.latestAction === INITIATE).subscribe((data) => {
      this.currentLanguage = data.lang;
    });

  }

  public updateDictionary(obj : {eng: Record<string, string>, swe: Record<string, string>}) {
    _.merge(this.dictionaries, obj);
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }
  public setCurrentLanguage(isoCode: string) {
    console.log("changing language to " + isoCode);
    this.currentLanguage = isoCode;
  }
  public getTranslationFor(source: string, defaultVal? : string): string {
    let term = this.dictionaries[this.currentLanguage][source];
    if (defaultVal) {
      return term || defaultVal;
    } else {
      return term || "-missing translation-";
    }
  }

  public getPrettyNumberString(input: string | number) {
    input = input.toString();
    let regex = /(\d+)(\d{3})/;
    let separator = this.getTranslationFor("THOUSANDS_SEPARATOR", ","); // TODO: Choose by language
    while(regex.test(input)) {
      input = input.replace(regex, "$1" + separator + "$2");
    }
    return input;
  }

}
