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

  private currentLanguage : string = "swe"; // TODO: The default language should be in some config (or chosen by locale)
  private dictionaries: any = {
    'swe' : {
      'swe' : 'Svenska',
      'eng' : 'Engelska',
      'related_documents' : 'Relaterade dokument',
      'search' : 'Sök',
      'search_document' : 'Sök i dokumentet',
      'hits' : 'Sökträffar',
      'sidebar_text_attributes' : 'Textattribut',
      'sidebar_structural_attributes' : 'Strukturella attribut',
      'sidebar_word_attributes' : 'Ordattribut',
      'corpus_id' : 'Samling',
      'keyword_search' : 'I följd',
      'word_attributes' : 'ordattribut',
      'structural_attributes' : 'strukturella attribut',
      'document' : 'dokument',
      'sentence' : "mening",
      'ne' : 'namntaggning',
      'paragraph' : 'stycke',
      'list_choose' : 'Välj fler från lista',
      'options' : 'alternativ',
      'no_choice' : 'inget val',
      'select_a_word' : 'markera ett ord för att se dess attribut',
      'found' : 'Hittade',
      'documents' : 'dokument',
      'color_mark_attribute' : 'Färgmarkera',
      'loading' : "Laddar",
      'THOUSANDS_SEPARATOR' : " "
    },
    'eng' : {
      'swe' : 'Swedish',
      'eng' : 'English',
      'related_documents' : 'Related documents',
      'search' : 'Search',
      'search_document' : 'Search the current document',
      'hits' : 'Hits',
      'sidebar_text_attributes' : 'Text attributes',
      'sidebar_structural_attributes' : 'Structural attributes',
      'sidebar_word_attributes' : 'Word attributes',
      'corpus_id' : 'Collection',
      'list_choose' : 'Select from list',
      'options' : 'options',
      'keyword_search' : 'In order',
      'word_attributes' : 'word attributes',
      'structural_attributes' : 'structural attributes',
      'document' : 'document',
      'sentence' : 'sentence',
      'ne' : 'named entity',
      'paragraph' : 'paragraph',
      'no_choice' : 'no choice',
      'select_a_word' : 'select a word to see its attributes',
      'found' : 'Found',
      'documents' : 'documents',
      'color_mark_attribute' : 'Colorize',
      'loading' : "Loading",
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
    let separator = this.getTranslationFor("THOUSANDS_SEPARATOR", ",");
    while (regex.test(input)) {
      input = input.replace(regex, "$1" + separator + "$2");
    }
    return input;
  }

}
