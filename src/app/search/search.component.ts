import { Component, OnInit } from '@angular/core';
import { Observable, Observer, Subscription, Subject } from 'rxjs';
import { take, mergeMap, switchMap, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as moment from "moment";

import { QueryService } from '../query.service';
import { CallsService } from '../calls.service';
import { KarpService } from '../karp.service';
import { LocService } from 'app/loc.service';
import { MetadataService } from 'app/metadata.service';
import { StrixEvent } from '../strix-event.enum';
import { SEARCH, CHANGEQUERY, CHANGEFILTERS, CHANGE_IN_ORDER, AppState, SearchRedux, CLOSEDOCUMENT, MODE_SELECTED, VECTOR_SEARCH, SELECTED_CORPORA, VECTOR_SEARCH_BOX, GOTOQUERY, CHANGELANG } from '../searchreducer';
import { Filter, QueryType } from '../strixquery.model';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { AppComponent } from 'app/app.component';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import * as _ from 'lodash';

@Component({
  selector: 'search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  public myControl = new FormControl();

  private searchRedux: Observable<SearchRedux>;

  private searchableAnnotations: string[] = ["lemgram", "betydelse"];
  private availableCorpora: { [key: string] : StrixCorpusConfig} = {};
  public searchType = QueryType.Normal;

  private asyncSelected: string = '';
  private asyncSelectedV: string = '';
  private asyncCopy: string = '';
  private dataSource: Observable<any>;
  public filteredOptions = [];
  public posLocalization = {};
  public posEng = {};
  public saveLemgrams = {};
  public saveStrings = {};
  public tempStore = '';
  public stringInFocus: string;
  private errorMessage: string;
  public currentLanguage: string;

  public currentFilters: Filter[] = [];

  public karpResult = [];
  public showHits = false;
  public valueChanged: Subject<string> = new Subject<string>();

  public selectSearch = 'Search tokens';
  public selectedOption = 'Search phrase';

  public vectorSearch = false;

  private histogramData: any;
  private histogramSelection: any;

  private fromYear: number;
  private toYear: number;

  private changeDates(dates: any) {
    this.fromYear = moment(dates.from*1000).year();
    this.toYear = moment(dates.to*1000).year();
    this.updateInterval();
  };

  private updateInterval() {
    // console.log("new interval", this.fromYear + "-" + this.toYear);
    let isSet = false;
    let value = {"range" : {"gte" : this.fromYear, "lte" : this.toYear}};
    // console.log("currentFilter*", this.currentFilters.length);
    for (let currentFilter of this.currentFilters) {
      // console.log("currentFilter*", currentFilter);
      if (currentFilter.field === "datefrom") {
        currentFilter.value = value;
        isSet = true;
      }
    }
    if (!isSet) {
      this.currentFilters.push({"field" : "datefrom", "value" : value});
    }
    this.updateFilters();
  }

  /*
    field : "fieldname",
    values : ["value1", "value2"]
  */

  private searchStatusSubscription: Subscription;
  public isSearching = false;
  public isPhraseSearch : boolean = false;
  private isInitialPart : boolean = false;
  private isMiddlePart : boolean = false;
  private isFinalPart : boolean = false;
  private isCaseSensitive : boolean = false;
  public selectedCorpora: string[];

  constructor(private callsService: CallsService,
              private karpService: KarpService,
              private queryService: QueryService,
              private appComponent: AppComponent,
              private metadataService: MetadataService,
              private locService: LocService,
              private store: Store<AppState>) {
    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.pipe(filter((d) => d.latestAction === CLOSEDOCUMENT)).subscribe((data) => {
      this.isPhraseSearch = !data.keyword_search;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CHANGELANG)).subscribe((data) => {
      this.currentLanguage = data.lang;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === SELECTED_CORPORA)).subscribe((data) => {
      this.selectedCorpora = data.corporaInMode;
      // this.posLocalization = {};
      // for (let i of this.metadataService.getWordAnnotationsFor(data.selectedCorpora[0])) {
      //   if (i['name'] === 'pos') {
      //     this.posLocalization = i.translation_karp
      //   }
      // }
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === GOTOQUERY)).subscribe((data) => {
      if (data.searchQuery[1] === 'quotes' && data.searchQuery[2] === 'simple') {
        this.asyncSelected = '"'+data.searchQuery[0]+'"'
        this.simpleSearch();
      } else if (data.searchQuery[1] !== 'quotes' && data.searchQuery[2] === 'simple') {
        this.asyncSelected = data.searchQuery[0]
        this.simpleSearch();
      }
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === VECTOR_SEARCH_BOX)).subscribe((data) => {
      this.asyncSelectedV = data.vectorQuery;
      this.vectorSearch = data.vectorSearchbox
    })

    this.searchRedux.pipe(filter((d) => d.latestAction === MODE_SELECTED)).subscribe((data) => {
      // this.isPhraseSearch = !data.keyword_search;
      this.asyncSelected = '';
      this.asyncCopy = '';
      this.asyncSelectedV = '';
      this.isPhraseSearch = true;
      this.vectorSearch = false;
      this.store.dispatch({ type: CHANGE_IN_ORDER, payload : !this.isPhraseSearch});
      this.store.dispatch({ type: CHANGEQUERY, payload : this.asyncSelected});
      this.store.dispatch({type : VECTOR_SEARCH, payload: {'vc': this.vectorSearch, '_query': this.asyncSelectedV}})
      if (data.search_type === 'simple') {
        this.store.dispatch({type : VECTOR_SEARCH_BOX, payload: {'search_type': 'simple', 'search_box': false}});
      }
      if (data.search_type === 'vector') {
        this.store.dispatch({type : VECTOR_SEARCH_BOX, payload: {'search_type': 'vector', 'search_box': true}});
      }
      // this.store.dispatch({ type: SEARCH, payload : null});
        // this.simpleSearch();
    });

    this.searchStatusSubscription = queryService.searchStatus$.subscribe(
      (answer: StrixEvent) => {
        // console.log("search status:", answer);
        switch (answer) { // TODO: Create an enum for this. Or a union type?
          case StrixEvent.SEARCHSTART:
            this.isSearching = true;
            break;
          case StrixEvent.SEARCHEND:
            this.isSearching = false;
            break;
        }
      },
      error => this.errorMessage = <any>error
    );

    this.dataSource = Observable.create((observer: Observer<any>) => {
      // Runs on every autocompletion search
      observer.next(this.asyncSelected);
    }).pipe(mergeMap((token: string) => this.karpService.lemgramsFromWordform(this.asyncSelected)));

    this.valueChanged
      .pipe(debounceTime(0), switchMap(changedValue => this.karpService.lemgramsFromWordform(changedValue.replace('"', ''))))
      .subscribe(value => {
        this.karpResult = value;
        this.filteredOptions = this.karpResult.filter(item => !item.includes('...'));
        this.filteredOptions = this.filteredOptions.filter(item => (!item.includes("_")))
        this.filteredOptions.sort();
        // console.log(value);
      })
  }

  ngOnInit() {
      this.availableCorpora = this.metadataService.getAvailableCorpora();
      this.searchRedux.pipe(take(1)).subscribe(data => {
      // this.getHistogramData(data.corpora);
      this.isPhraseSearch = !data.keyword_search
      // this.posLocalization = {};
      // let wordAnno = this.availableCorpora['vivill']['wordAttributes'];
      // for (let i of wordAnno) {
      //   if (i['name'] === 'pos') {
      //     this.posLocalization = i.translation_karp
      //   }
      // }
      // for (let i in this.posLocalization) {
      //   this.posEng[this.posLocalization[i].eng] = i;
      // }
      if(data.query) {
        this.asyncSelected = data.query.replace('§', ' ').replace(/lemgram:/g, '').replace(/word:/g, '');
        let y = [];
        for (let i of this.asyncSelected.split(' ')) {
          if (i.includes('..')) {
            y.push(i.split('..')[0].replace(/_/g, ' ') + '(' + this.locService.getTranslationFor(i.split('..')[1].split('.')[0]) + ')');
            this.saveStrings[i.split('..')[0].replace(/_/g, ' ') + '(' + this.locService.getTranslationFor(i.split('..')[1].split('.')[0]) + ')'] = i;
            this.saveLemgrams[i] = i.split('..')[0] + '(' + this.locService.getTranslationFor(i.split('..')[1].split('.')[0]) + ')';
          } else {
            y.push(i)
          }
        }
        this.asyncSelected = y.join(' ')
      }
      if (data.search_type === "simple") {
        this.vectorSearch = false;
      };
      if (data.search_type === "vector") {
        this.asyncSelectedV = data.vectorQuery;
        this.vectorSearch = true;
        this.store.dispatch({type : VECTOR_SEARCH, payload: {'vc': this.vectorSearch, '_query': this.asyncSelectedV}})
      };
    });

    /* this.searchRedux.filter((d) => d.latestAction === CHANGECORPORA).subscribe((data) => {
      console.log("acting upon", data.latestAction);
      this.getHistogramData(data.corpora);
    }); */
  }

  public searchTypeChange(val) {
    // console.log("searchTypeChange", val)
    this.store.dispatch({type : CHANGE_IN_ORDER, payload: !val})
  }

  public searchVectorMode(val) {
    // console.log("searchVectorMode", val, this.vectorSearch)
    this.store.dispatch({type : VECTOR_SEARCH_BOX, payload: !val})
    // if (!val) {
    //   this.clearSimpleSearch();
    // }
  }

  private clearSimpleSearch() {
    this.asyncSelected = '';
    this.asyncCopy = '';
    this.simpleSearch();
    // this.store.dispatch({type : CHANGE_IN_ORDER, payload: !val})
  }

  public getLemgram() {
    // console.log("----", this.myControl.value, this.myControl.value.split('..')[0], this.stringInFocus, this.tempStore, this.asyncCopy)
    let startChar = '';
    let middleString = [];
    let endChar = '';
    if (this.tempStore.slice(0,1) === '"') {
      this.tempStore = this.tempStore.substring(1)
      startChar = '"'
    }
    if (this.tempStore.slice(-1) === '"') {
      this.tempStore = this.tempStore.slice(0, -1)
      endChar = '"'
    }
    let newStore = ''; 
    if (this.myControl.value.includes('_') && this.myControl.value.split('..')[0] !== this.stringInFocus) {
      this.asyncCopy = this.asyncCopy.replace(this.stringInFocus+'$', this.myControl.value)
      newStore = this.tempStore.replace(this.stringInFocus+'$', this.myControl.value)
    } else if (this.myControl.value.split('..')[0] === this.stringInFocus.replace('"', '')) {
      this.asyncCopy = this.asyncCopy.replace(this.stringInFocus, this.myControl.value)
      if (this.stringInFocus.includes('$')) {
        newStore = this.tempStore.replace(this.stringInFocus+'$', this.myControl.value).replace('$', '')
      } else {
        newStore = this.tempStore.replace(this.stringInFocus.replace('"', ''), this.myControl.value).replace('$', '')
      }
    } else {
      newStore = this.tempStore.replace(this.stringInFocus, this.myControl.value).replace('$', '')
    }
    this.tempStore = newStore;
    if (this.tempStore.split(' ').length > 1) {
      for (let i of this.tempStore.split(' ')) {
        if (i.includes('..')) {
          i = i.replace(/ /g, '_')
          middleString.push(i.split('..')[0].replace(/_/g, ' ') + '(' + this.locService.getTranslationFor(i.split('..')[1].split('.')[0]) + ')');
          this.saveStrings[i.split('..')[0].replace(/_/g, ' ') + '(' + this.locService.getTranslationFor(i.split('..')[1].split('.')[0]) + ')'] = i;
          this.saveLemgrams[i] = i.split('..')[0] + '(' + this.locService.getTranslationFor(i.split('..')[1].split('.')[0]) + ')';
        } else {
          middleString.push(i)
        }
      }
    } else if (this.myControl.value.includes('..')) {
      middleString.push(this.myControl.value.split('..')[0].replace(/_/g, ' ') + '(' + this.locService.getTranslationFor(this.myControl.value.split('..')[1].split('.')[0]) + ')');
      this.saveStrings[this.myControl.value.split('..')[0].replace(/_/g, ' ') + '(' + this.locService.getTranslationFor(this.myControl.value.split('..')[1].split('.')[0]) + ')'] = this.myControl.value;
      this.saveLemgrams[this.myControl.value] = this.myControl.value.split('..')[0] + '(' + this.locService.getTranslationFor(this.myControl.value.split('..')[1].split('.')[0]) + ')';
    } else {
      middleString.push(newStore)
    }
    this.asyncSelected = startChar+middleString.join(' ')+endChar;
    // console.log(this.saveLemgrams, this.saveStrings)
  }

  private onChangeEvent(event: any) {
    if (event.inputType === 'deleteContentBackward') {
      let x = event.target.value;
      let y  = {};
      let z1 = [];
      let z2 = [];
      for (let i in x) {
        if (x[i] === ' ') {
          y[z1.join('')] = z2
          z1 = [];
          z2 = [];
        } else if (x.length-1 === Number(i)) {
          z1.push(x[i]);
          z2.push(i);
          y[z1.join('')] = z2
        } else {
          z1.push(x[i]);
          z2.push(i);
        }
      }
      if (_.keys(y).length > 0) {
        let keyFound = false
        for (let key in y) {
          if (y[key].includes(String(event.target.selectionStart-1)) && (key.includes("\(") || key.includes("\)")) && key.slice(-1) !== ")" && !keyFound) {
            keyFound = true
            if (key[0] === '"') {
              this.asyncSelected = this.asyncSelected.replace(key.substring(1), '');
              this.asyncCopy =  this.asyncCopy.replace(this.saveStrings[key.substring(1)+')'], '')
              event.target.value = event.target.value.replace(key.substring(1), ' ')
            } else if (key.slice(-1) === '"') {
              this.asyncSelected = this.asyncSelected.replace(key.slice(0, -1), '');
              this.asyncCopy =  this.asyncCopy.replace(this.saveStrings[key.slice(0, -1)+')'], '')
              event.target.value = event.target.value.replace(key.slice(0, -1), '')
            } else {
              this.asyncSelected = this.asyncSelected.replace(key, '');
              event.target.value = event.target.value.replace(key, '')
              this.asyncCopy =  this.asyncCopy.replace(this.saveStrings[key+')'], '')
            }
          }
          if (this.asyncSelected[0] === ' ') {
            this.asyncSelected = this.asyncSelected.replace(' ', '')
            event.target.value = event.target.value.replace(' ', '')
          }
          if (this.asyncSelected.slice[-1] === ' ') {
            this.asyncSelected = this.asyncSelected.replace(' ', '')
            event.target.value = event.target.value.replace(' ', '')
          }
          this.asyncSelected = this.asyncSelected.replace('  ', ' ')
          this.asyncSelected = this.asyncSelected.replace('" ', '"')
          this.asyncSelected = this.asyncSelected.replace(' "', '"')
          this.asyncCopy = this.asyncCopy.replace('  ', ' ')
          this.asyncCopy = this.asyncCopy.replace('" ', '"')
          this.asyncCopy = this.asyncCopy.replace(' "', '"')
          // this.simpleSearch();
        }
      }
    }
    this.filteredOptions = [];
    if (event.target.selectionStart === event.target.value.length || event.target.value[event.target.selectionStart] === '"') {
      let currentString = '';
      if (event.target.value.includes(' ')) {
        this.asyncCopy = event.target.value;
        for (let key in this.saveStrings) {
          if (this.asyncCopy.includes(key)) {
            this.asyncCopy = this.asyncCopy.replace(key, this.saveStrings[key])
          }
        }
        let temp = this.asyncCopy.split(' ');
        currentString = temp.splice(-1, 1)[0];
        this.stringInFocus = currentString.replace('"', '');
        this.tempStore = temp.join(' ') + ' ' + currentString+'$';
        this.asyncCopy = this.asyncCopy+'$';
        this.valueChanged.next(currentString);
      } else {
        currentString = event.target.value;
        this.asyncCopy = event.target.value+'$';
        this.tempStore = event.target.value+'$';
        this.stringInFocus = currentString.replace('"', '');
        this.valueChanged.next(currentString);
      }
    } else if (event.target.value[event.target.selectionStart] === ' ') {
      let x = event.target.value;
      let y  = {};
      let z1 = [];
      let z2 = [];
      for (let i in x) {
        if (x[i] === ' ') {
          y[z1.join('')] = z2
          z1 = [];
          z2 = [];
        } else if (x.length-1 === Number(i)) {
          z1.push(x[i]);
          z2.push(i);
          y[z1.join('')] = z2
        } else {
          z1.push(x[i]);
          z2.push(i);
        }
      }
      if (_.keys(y).length > 1) {
        let tempArray = [];
        let currentString = '';
        for (let key in y) {
          if (y[key].includes(String(event.target.selectionStart-1))) {
            currentString = key;
            this.stringInFocus = currentString;
            tempArray.push(key+'$');
          } else {
            tempArray.push(key)
          }
        }
        this.asyncCopy = tempArray.join(' ');
        for (let key in this.saveStrings) {
          if (this.asyncCopy.includes(key)) {
            this.asyncCopy = this.asyncCopy.replace(key, this.saveStrings[key])
          }
        }
        this.tempStore = this.asyncCopy;
        this.valueChanged.next(currentString);
      }
    } else {
      // need to see if this condition will ever be used in search
      // console.log("If this condition is executed then it will leads to nowhere, need to be rewritten in that case.")
      if (event.target.value.includes(' ')) {
        let x = event.target.value;
        let y  = {};
        let z1 = [];
        let z2 = [];
        for (let i in x) {
          if (x[i] === ' ') {
            y[z1.join('')] = z2
            z1 = [];
            z2 = [];
          } else if (x.length-1 === Number(i)) {
            z1.push(x[i]);
            z2.push(i);
            y[z1.join('')] = z2
          } else {
            z1.push(x[i]);
            z2.push(i);
          }
        }
      }
    }
  }

  public changeSearchType(item) {
    if (item === 'Search phrase') {
      this.isPhraseSearch = false;
      this.store.dispatch({type : CHANGE_IN_ORDER, payload: !this.isPhraseSearch})
    } else {
      this.isPhraseSearch = true;
      this.store.dispatch({type : CHANGE_IN_ORDER, payload: !this.isPhraseSearch})
    }
  }

  private getHistogramData(corpora: string[]) {
    // console.log("getting histogram data.");
    this.callsService.getDateHistogramData(corpora[0]).subscribe((histogramData) => {
      this.histogramData = histogramData;
      // console.log("got histogram data", histogramData);
    });
  }

  public simpleSearch() {
    this.filteredOptions = [];
    if (this.vectorSearch) {
      this.appComponent.selectedTabV.setValue(0);
      this.store.dispatch({type : VECTOR_SEARCH, payload: {'vc': this.vectorSearch, '_query': this.asyncSelectedV}})
    } else {
      if (this.asyncSelected.includes('""') || this.asyncSelected.includes('" "')) {
        this.isPhraseSearch = true;
        this.store.dispatch({ type: CHANGE_IN_ORDER, payload : !this.isPhraseSearch});
      } else if (this.asyncSelected[0] === '"' && this.asyncSelected.charAt(this.asyncSelected.length -1) === '"') {
        this.isPhraseSearch = true;
        this.store.dispatch({ type: CHANGE_IN_ORDER, payload : !this.isPhraseSearch});
      } else if (this.asyncSelected === '') {
        this.isPhraseSearch = true;
        this.store.dispatch({ type: CHANGE_IN_ORDER, payload : !this.isPhraseSearch});
      } else {
        this.isPhraseSearch = false;
        this.store.dispatch({ type: CHANGE_IN_ORDER, payload : !this.isPhraseSearch});
      }
      // this.store.dispatch({type : VECTOR_SEARCH, payload: this.vectorSearch})
      this.asyncCopy = this.asyncCopy.replace('$', '');
      if (this.asyncSelected[this.asyncSelected.length-1] === ' ') {
        let tempData = [];
        for (let x of this.asyncCopy.split(' ')) {
          if (_.keys(this.saveStrings).includes(x)) {
            tempData.push(this.saveStrings[x])
          } else if (x.includes('(') && x.includes(')')) {
            let inString = x.replace(')', '');
            let splitString = inString.split('(');
            let numberString = '1';
            if (splitString[0].slice(-1) === '2') {
              numberString = '2';
              tempData.push(splitString[0].slice(0,-1)+'..'+this.locService.getTranslationFor(splitString[1])+'.2')
            } else if (splitString[0].slice(-1) === '3') {
              tempData.push(splitString[0].slice(0,-1)+'..'+this.locService.getTranslationFor(splitString[1])+'.3')
            } else {
              tempData.push(splitString[0]+'..'+this.locService.getTranslationFor(splitString[1])+'.1')
            }
          } else {
            tempData.push(x)
          } 
        }
        let tempDataX = []
        
        for (let i of tempData) {
          if (i.includes('..')) {
            tempDataX.push('lemgram:'+i)
          } else if (i.length > 0) {
            tempDataX.push('word:'+i)
          }
        }
        this.store.dispatch({ type: CHANGEQUERY, payload : tempDataX.join('§').replace(/"/g, '')});
        this.store.dispatch({ type: SEARCH, payload : null});
      } else {
        let tempData = [];
        for (let x of this.asyncCopy.split(' ')) {
          let startChar = '';
          let endChar = '';
          if (x.slice(-1) === '"') {
            x = x.slice(0, -1)
            endChar = ''
          }
          if (x.slice(0,1) === '"') {
            x = x.substring(1)
            startChar = ''
          }
          if (_.keys(this.saveStrings).includes(x)) {
            tempData.push(startChar+this.saveStrings[x]+endChar)
          } else if (x.includes('(') && x.includes(')')) {
            let inString = x.replace(')', '');
            let splitString = inString.split('(');
            let numberString = '1';
            if (splitString[0].slice(-1) === '2') {
              numberString = '2';
              tempData.push(startChar+splitString[0].slice(0,-1)+'..'+this.locService.getTranslationFor(splitString[1])+'.2'+endChar)
            } else if (splitString[0].slice(-1) === '3') {
              tempData.push(startChar+splitString[0].slice(0,-1)+'..'+this.locService.getTranslationFor(splitString[1])+'.3'+endChar)
            } else {
              tempData.push(startChar+splitString[0]+'..'+this.locService.getTranslationFor(splitString[1])+'.1'+endChar)
            }
          } else {
            tempData.push(startChar+x+endChar)
          } 
        }
        let tempDataX = []
        
        for (let i of tempData) {
          if (i.includes('..')) {
            tempDataX.push('lemgram:'+i)
          } else if (i.length > 0) {
            tempDataX.push('word:'+i)
          }
        }
        this.store.dispatch({ type: CHANGEQUERY, payload : tempDataX.join('§').replace(/"/g, '')});
        this.store.dispatch({ type: SEARCH, payload : null});
      }
    }
  }

  /* This should read from the current query (in the query-service)
     and update this component's GUI accordingly. */
  private updateGUIFromCurrentQuery() {
    this.asyncSelected = this.queryService.getSearchString();
  }

  private typeaheadOnSelect(event) {
    console.log("Selected something with the event", event);
  }

  public toggled(open: boolean): void {
    console.log('Dropdown is now: ', open);
  }

  private purgeFilter(aggregationKey: string) {
    for (let i = 0; i < this.currentFilters.length; i++) {
      if (this.currentFilters[i].field === aggregationKey) {
        this.currentFilters.splice(i, 1);
        break;
      }
    }
    this.updateFilters();
  }

  private updateFilters() {
    this.store.dispatch({ type: CHANGEFILTERS, payload : this.currentFilters});
    this.store.dispatch({ type: SEARCH, payload : null});
  }

}
