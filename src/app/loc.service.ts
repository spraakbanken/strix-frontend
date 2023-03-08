import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';

import { AppState, CHANGELANG, INITIATE, SearchRedux, MODE_SELECTED, SELECTED_CORPORA } from './searchreducer';
import { filter } from 'rxjs/operators';
import { LangPhrases } from './loc.model';

@Injectable()
export class LocService {

  static readonly MISSING = '-missing translation-';
  static readonly LOCALE_MAP = { // TODO: Use 2-letter codes everywhere?
    'sv' : 'swe',
    'en' : 'eng',
  };

  private searchRedux: Observable<SearchRedux>;

  private currentLanguage: string;
  private modeSelected: {};
  private selectedCorpora: [];
  private dictionaries: LangPhrases = {
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
      'corpus_idS' : 'Korpusar',
      'keyword_search' : 'I följd och även som',
      'initial_search' : 'förled',
      'medial_search' : 'mellanled',
      'final_search' : 'efterled och',
      'case_sensitive_search' : 'skiftlägesoberoende',
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
      'color_mark_attribute' : 'Utforska',
      'close_doc' : 'Stäng dokument',
      'loading' : "Laddar",
      'THOUSANDS_SEPARATOR' : " ",
      'login' : 'Logga in',
      'logout' : 'Logga ut',
      'RD': 'RD',
      'Dream': 'Dream',
      'pT': 'Föregående',
      'nT': 'Nästa',
      'docPs': 'Dokument per sida',
      'citeStrix': 'Referera till Strix',
      'topMenu' : 'Meny',
      'DReaM' : 'DReaM',
      'Modern' : 'Moderna',
      'Parallel' : 'Parallela',
      'Riksdag' : 'Riksdag',
      'Mink' : 'Mink',
      'LB' : 'Litteraturbanken',
      'select_data' : 'Välj data',
      'simple_search' : 'Enkel sökning',
      'advance_search' : 'Avancerad sökning',
      'corpus' : 'Korpus',
      'title' : 'Titel',
      'yearS' : 'År',
      'tokens' : 'Dokumentstorlek',
      'token' : 'token',
      'authorS' : 'Författare',
      'mostCommonNoun' : 'Vanligaste substantiven',
      'text_attributes' : 'Textfilter',
      'add_filter' : 'Lägg till filter',
      'selected_filters' : 'Valda filter',
      'selected_corpora' : 'korpusar valda',
      'of' : 'av',
      'statSelection': "Statistik",
      'more' : 'Fler',
      'aboutS' : 'Om Strix',
      'searchC': 'Sök korpus',
      'corpusSize' : 'Korpusstorlek',
      'selectAll' : 'Markera alla',
      'selectNone' : 'Avmarkera',
      'default' : 'Standard',
      'ners' : 'Vanligaste NER',
      'openTab' : 'Öppna relaterade dokument',
      'corpusName' : 'Korpusnamn',
      'sameCorpus' : 'Nuvarande korpus',
      'sameMode' : 'Alla korpusar',
      'yearNA' : 'Inkludera dokument med årsuppgifter NA',
      'applyFilter' : 'Använda filter',
      'frequency' : 'Frekvens',
      'name' : 'Namn',
      'numDoc': 'Antal dokument'
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
      'corpus_id' : 'Corpuses',
      'corpus_idS' : 'Corpora',
      'list_choose' : 'Select from list',
      'options' : 'options',
      'keyword_search' : 'In order and also as',
      'initial_search' : 'initial part',
      'medial_search' : 'medial part',
      'final_search' : 'final part and',
      'case_sensitive_search' : 'case-sensitive',
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
      'color_mark_attribute' : 'Explore',
      'close_doc' : 'Close Document',
      'loading' : "Loading",
      'THOUSANDS_SEPARATOR' : ",",
      'login' : 'Login',
      'logout' : 'Logout',
      'RD': 'RD',
      'Dream' : 'Dream',
      'pT' : 'Previous',
      'nT' : 'Next',
      'docPs': 'Documents per page',
      'citeStrix': 'Cite Strix',
      'topMenu' : 'Menu',
      'DReaM' : 'DReaM',
      'Modern' : 'Modern',
      'Parallel' : 'Parallel',
      'Riksdag' : 'Riksdag',
      'Mink' : 'Mink',
      'LB' : 'Literature Bank',
      'select_data' : 'Select data',
      'simple_search' : 'Simple search',
      'advance_search' : 'Advanced search',
      'corpus' : 'Corpus',
      'title' : 'Title',
      'yearS' : 'Year',
      'tokens' : 'Document size',
      'token' : 'tokens',
      'authorS' : 'Author',
      'mostCommonNoun' : 'Most common nouns',
      'text_attributes' : 'Text filters',
      'add_filter' : 'Add filters',
      'selected_filters': 'Selected filters',
      'selected_corpora' : 'corpora selected',
      'of' : 'of',
      'statSelection': "Statistics",
      'more' : 'More',
      'aboutS' : 'About Strix',
      'searchC': 'Search corpus',
      'corpusSize': 'Corpus size',
      'selectAll' : 'Select all',
      'selectNone' : 'Deselect all',
      'default' : 'Default',
      'ners' : 'Most common NER',
      'openTab' : 'Open related documents',
      'corpusName' : 'Corpus name',
      'sameCorpus' : 'Current corpus',
      'sameMode' : 'All corpora',
      'yearNA' : 'Include documents with year information NA',
      'applyFilter' : 'Apply filters',
      'frequency' : 'Frequency',
      'name' : 'Name',
      'numDoc': '# Documents'
    }
  };

  constructor(private store: Store<AppState>) {

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.pipe(filter((d) => d.latestAction === CHANGELANG || d.latestAction === INITIATE)).subscribe((data) => {
      this.setCurrentLanguage(data.lang);
      // this.modeSelected = data.modeSelected;
      // this.selectedCorpora = data.selectedCorpora;
    });

    // this.searchRedux.pipe(filter((d) => d.latestAction === MODE_SELECTED || d.latestAction === SELECTED_CORPORA)).subscribe((data) => {
    //   this.selectedCorpora = data.selectedCorpora;
    // });

  }

  public updateDictionary(obj : {eng: Record<string, string>, swe: Record<string, string>}) {
    _.merge(this.dictionaries, obj);
  }

  public getAvailableLanguages(): string[] {
    return _.keys(this.dictionaries);
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }
  // public getCurrentMode(): {} {
  //   return this.modeSelected;
  // }
  // public getSelectedCorpora(): [] {
  //   return this.selectedCorpora;
  // }
  public setCurrentLanguage(isoCode: string) {
    console.log("changing language to " + isoCode);
    this.currentLanguage = isoCode;
  }
  public getTranslationFor(source: string, defaultVal? : string): string {
    return _.get(this.dictionaries, [this.getCurrentLanguage(), source]) || (defaultVal || LocService.MISSING);
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

  public getDataLanguage(iKey: string) {
    return this.dictionaries[this.getCurrentLanguage()][iKey];
  }
}
