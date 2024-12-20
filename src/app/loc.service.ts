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
      'hits' : 'Dokument',
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
      'sentences': 'mening',
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
      'text_attributes' : 'Dokumentfilter',
      'add_filter' : 'Lägg till filter',
      'selected_filters' : 'Valda filter',
      'selected_corpora' : 'korpusar valda',
      'selected_related' : 'Utvalda korpusar',
      'of' : 'av',
      'statSelection': "Statistik",
      'viewmap': "Karta",
      'city': "Stad",
      'geo_location': "Plats",
      'topicview': "Ämne",
      'overview': "Overview",
      'vectorS': "Vector search",
      'vector_search': "Dokumentsökning",
      'semantic': "Semantic",
      'more' : 'Fler',
      'aboutS' : 'Om Strix',
      'searchC': 'Sök korpus',
      'corpusSize' : 'Korpusstorlek',
      'selectAll' : 'Markera alla',
      'selectNone' : 'Avmarkera',
      'default' : 'Standard',
      'ners' : 'Vanligaste namn',
      'openTab' : 'Öppna relaterade dokument',
      'corpusName' : 'Korpusnamn',
      'sameCorpus' : 'Nuvarande korpus',
      'sameMode' : 'Alla korpusar',
      'yearNA' : 'Inkludera dokument med årsuppgifter NA',
      'applyFilter' : 'Använda filter',
      'frequency' : 'Frekvens',
      'name' : 'Namn',
      'numDoc': 'Antal dokument',
      'xclude': 'Excluded filters',
      'number_format': 'sv-SV',
      'doc_stat': 'Statistikvy',
      'item': 'Item',
      'doc_view': 'Dokumentvy',
      'recent_updates': 'Senaste uppdateringar',
      'upcoming_updates': 'Kommande uppdateringar',
      'search_examples': 'Exempelsökningar',
      'news': 'Nyheter',
      'recent_corpora': 'Nyligen tillagda korpusar',
      'all_corpora': 'Alla korpus',
      '_in': 'i',
      'exact_w_p': 'Exakt ord eller fras',
      'word': 'Ord',
      'multi_word': 'Flera ord',
      'Sentence': 'Mening',
      'Document': 'Dokument',
      'no_doc_found': 'Inga dokument hittades',
      'select_corpus': 'Ingen korpus är vald',
      'source_link': 'Källa',
      'sbxtool': 'SBX verktyg',
      'current_attribute': 'Nuvarande attribut',
      'load_corpora': 'Hämtar data (det kan ta ett par sekunder)....',
      'load_documents': 'Hämtar dokument (det kan ta ett par sekunder)....',
      'wait_load': 'Väntar på att data ska laddas....',
      'ab': 'adverb',
      'aba': 'adverb, förkortning',
      'abh': 'adverbsuffix',
      'abm': 'adverb, flerording',
      'al': 'artikel',
      'av': 'adjektiv',
      'ava': 'adjektiv, förkortning',
      'avh': 'substantivsuffix',
      'avm': 'adjektiv, flerording',
      'ie': 'infinitivmärke',
      'in': 'interjektion',
      'inm': 'interjection, flerording',
      'kn': 'konjunktion',
      'kna': 'konjunktion, förkortning',
      'knm': 'konjunktion, flerording',
      'mxc': 'flerordsprefix',
      'nl': 'numeral',
      'nlm': 'numeral, flerording',
      'nn': 'substantiv',
      'nna': 'substantiv, förkortning',
      'nnm': 'substantiv, flerording',
      'pm': 'egennamn',
      'pma': 'egennamn, förkortning',
      'pmm': 'egennamn, flerording',
      'pn': 'pronomen',
      'pnm': 'pronoun, flerording',
      'pp': 'preposition',
      'ppa': 'preposition, förkortning',
      'ppm': 'preposition, flerording',
      'sn': 'subjunktion',
      'snm': 'subjunktion, flerording',
      'ssm': 'flerording',
      'sxc': 'prefix',
      'vb': 'verb',
      'vba': 'verb, förkortning',
      'vbm': 'verb, flerording',
      'score': 'Score'
    },
    'eng' : {
      'swe' : 'Swedish',
      'eng' : 'English',
      'related_documents' : 'Related documents',
      'search' : 'Search',
      'search_document' : 'Search the current document',
      'hits' : 'Documents',
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
      'text_attributes' : 'Document filter',
      'add_filter' : 'Add filters',
      'selected_filters': 'Selected filters',
      'selected_corpora' : 'corpora selected',
      'selected_related' : 'Selected corpora',
      'of' : 'of',
      'statSelection': "Statistics",
      'viewmap': "Map",
      'city': "City",
      'geo_location': "Location",
      'topicview': "Topics",
      'overview': "Overview",
      'vectorS': "Vector search",
      'vector_search': "Document search",
      'semantic': "Semantic",
      'more' : 'More',
      'aboutS' : 'About Strix',
      'searchC': 'Search corpus',
      'corpusSize': 'Corpus size',
      'selectAll' : 'Select all',
      'selectNone' : 'Deselect all',
      'default' : 'Default',
      'ners' : 'Most common names',
      'openTab' : 'Open related documents',
      'corpusName' : 'Corpus name',
      'sameCorpus' : 'Current corpus',
      'sameMode' : 'All corpora',
      'yearNA' : 'Include documents with year information NA',
      'applyFilter' : 'Apply filters',
      'frequency' : 'Frequency',
      'name' : 'Name',
      'numDoc': 'Documents',
      'xclude': 'Excluded filters',
      'number_format': 'en-US',
      'sentences': 'Sentences',
      'doc_stat': 'Statistics view',
      'item': 'Item',
      'doc_view': 'Document view',
      'recent_updates': 'Recent updates',
      'upcoming_updates': ' Upcoming updates',
      'search_examples': 'Search examples',
      'news': 'News',
      'recent_corpora': 'Recently added corpora',
      'all_corpora': 'All corpora',
      '_in': 'in',
      'exact_w_p': 'Exact word or phrase',
      'word': 'Word',
      'multi_word': 'Multiple words',
      'Sentence': 'Sentence',
      'Document': 'Document',
      'no_doc_found': 'No documents found',
      'select_corpus': 'No corpus is selected',
      'source_link' : 'Source',
      'sbxtool': 'SBX tools',
      'current_attribute': 'Current attribute',
      'load_corpora': 'Loading data (this may take a couple of seconds)....',
      'load_documents': 'Loading documents (this may take a couple of seconds)....',
      'wait_load': 'Waiting for the data to load....',
      'ab': 'adverb',
      'aba': 'adverb, abbreviation',
      'abh': 'adverb suffix',
      'abm': 'multiword adverb',
      'al': 'article',
      'av': 'adjective',
      'ava': 'adjective, abbreviation',
      'avh': 'substantivsuffix',
      'avm': 'multiword adjective',
      'ie': 'infinitive particle',
      'in': 'interjection',
      'inm': 'multiword interjection',
      'kn': 'conjunction',
      'kna': 'conjunction, abbreviation',
      'knm': 'multiword conjunction',
      'mxc': 'multiword prefix',
      'nl': 'numeral',
      'nlm': 'multiword numeral',
      'nn': 'noun',
      'nna': 'noun, abbreviation',
      'nnm': 'multiword noun',
      'pm': 'proper noun',
      'pma': 'proper noun, abbreviation',
      'pmm': 'multiword proper noun',
      'pn': 'pronoun',
      'pnm': 'multiword pronoun',
      'pp': 'preposition',
      'ppa': 'preposition, abbreviation',
      'ppm': 'multiword preposition',
      'sn': 'subjunction',
      'snm': 'multiword subjunction',
      'ssm': 'multiword',
      'sxc': 'prefix',
      'vb': 'verb',
      'vba': 'verb, abbreviation',
      'vbm': 'multiword verb',
      'score': 'Score'
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
    // console.log("changing language to " + isoCode);
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
