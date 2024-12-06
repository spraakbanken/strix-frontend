import { Component, OnInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { Observable, Observer, Subscription } from 'rxjs';
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
import { FormControl, FormGroup, Validators, FormBuilder, FormArray} from '@angular/forms';
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

  @ViewChildren('textInput',{read:ElementRef}) inputs:QueryList<ElementRef>
  public stringsForm = this.fb.group({
    strings: new FormArray([])
  });

  public minWidth = 8;
  public remainingSpace = 740;
  public myControl = new FormControl();

  private searchRedux: Observable<SearchRedux>;

  private searchableAnnotations: string[] = ["lemgram", "betydelse"];
  private availableCorpora: { [key: string] : StrixCorpusConfig} = {};
  public searchType = QueryType.Normal;

  private asyncSelected: string = '';
  private asyncSelectedV: string = '';
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
  // public valueChanged: Subject<string> = new Subject<string>();

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

  private searchStatusSubscription: Subscription;
  public isSearching = false;
  public isPhraseSearch : boolean = false;
  public selectedCorpora: string[];

  constructor(private callsService: CallsService,
              private karpService: KarpService,
              private queryService: QueryService,
              private appComponent: AppComponent,
              private metadataService: MetadataService,
              private locService: LocService,
              private store: Store<AppState>,
              private fb: FormBuilder) {
    this.searchRedux = this.store.select('searchRedux');

    this.strings.push(this.getInput(0))

    this.searchRedux.pipe(filter((d) => d.latestAction === CLOSEDOCUMENT)).subscribe((data) => {
      this.isPhraseSearch = !data.keyword_search;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CHANGELANG)).subscribe((data) => {
      this.currentLanguage = data.lang;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === SELECTED_CORPORA)).subscribe((data) => {
      this.selectedCorpora = data.corporaInMode;
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
      this.asyncSelected = '';
      this.asyncSelectedV = '';
      this.isPhraseSearch = true;
      this.vectorSearch = false;
      this.strings.clear();
      this.addString(-1);
      this.store.dispatch({ type: CHANGE_IN_ORDER, payload : !this.isPhraseSearch});
      this.store.dispatch({ type: CHANGEQUERY, payload : this.asyncSelected});
      this.store.dispatch({type : VECTOR_SEARCH, payload: {'vc': this.vectorSearch, '_query': this.asyncSelectedV}})
      if (data.search_type === 'simple') {
        this.store.dispatch({type : VECTOR_SEARCH_BOX, payload: {'search_type': 'simple', 'search_box': false}});
      }
      if (data.search_type === 'vector') {
        this.store.dispatch({type : VECTOR_SEARCH_BOX, payload: {'search_type': 'vector', 'search_box': true}});
      }
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

    // this.valueChanged
    //   .pipe(debounceTime(0), switchMap(changedValue => this.karpService.lemgramsFromWordform(changedValue.replace('"', ''))))
    //   .subscribe(value => {
    //     this.karpResult = value;
    //     this.filteredOptions = this.karpResult.filter(item => !item.includes('...'));
    //     this.filteredOptions = this.filteredOptions.filter(item => (!item.includes("_")))
    //     this.filteredOptions.sort();
    //     // console.log(value);
    //   })
  }

  ngOnInit() {
      this.availableCorpora = this.metadataService.getAvailableCorpora();
      this.searchRedux.pipe(take(1)).subscribe(data => {
      this.isPhraseSearch = !data.keyword_search
      if(data.query) {
        this.asyncSelected = '';
        let storedQuery = data.query.split('§')
        for (let item in storedQuery) {
          if (storedQuery[item].split(':')[0] === 'word') {
            this.strings.insert(Number(item), this.fb.group({
              currentInput: this.fb.control(storedQuery[item].split(':')[1]),
              currentWidth: this.fb.control((storedQuery[item].split(':')[1].length +1) * 7),
              backgroundColor: this.fb.control('lightblue'),
              savedLemgram: this.fb.control(''),
              savedWord: this.fb.control(storedQuery[item].split(':')[1])
            })
            )
          } else if (storedQuery[item].split(':')[0] === 'lemgram') {
            this.strings.insert(Number(item), this.fb.group({
              currentInput: this.fb.control(storedQuery[item].split(':')[1].split('..')[0].replace(/_/g, ' ') + ' (' 
              + this.locService.getTranslationFor(storedQuery[item].split(':')[1].split('..')[1].split('.')[0]) + ')'),
              currentWidth: this.fb.control((storedQuery[item].split(':')[1].split('..')[0].replace(/_/g, ' ') + ' (' 
              + this.locService.getTranslationFor(storedQuery[item].split(':')[1].split('..')[1].split('.')[0]) + ')').length * 7),
              backgroundColor: this.fb.control('bisque'),
              savedLemgram: this.fb.control(storedQuery[item].split(':')[1]),
              savedWord: this.fb.control('')
            })
            )
          }
        }
        for (let item in this.strings.controls) {
          this.asyncSelected = this.asyncSelected + ' ' + this.strings.controls[item].value.currentInput;
          if (this.strings.controls[item].value.currentInput.length === 0) {
            let currentSpace = 0;
            for (let item1 of this.strings.controls) {
              currentSpace = currentSpace + item1.value.currentWidth;
            }
            this.strings.controls[item].patchValue({"currentWidth": this.remainingSpace - currentSpace});
          }
        }
        setTimeout(()=>{
          this.inputs.last.nativeElement.focus()
        })
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
  }

  get strings() {
    return this.stringsForm.get('strings') as FormArray;
  }

  public addString(id) {
    for (let item in this.strings.controls) {
      if (this.strings.controls[item].value['currentInput'] === '') {
        this.removeString(Number(item))
      }
    }
    if (id === this.strings.controls.length) {
      this.strings.push(this.getInput(id))
    } else {
      this.strings.insert(id+1, this.getInput(id+1))
    }
    
    setTimeout(()=>{
      let inputID = document.getElementById("id_"+(id+1).toString())
      inputID.focus()
  })
  }

  public getInput(item): FormGroup {
    let currentSpace = 0
    for (let item of this.strings.controls) {
      if (item.value.currentWidth > 0) {
        currentSpace = currentSpace + item.value.currentWidth;
      }
    }
    let assignSpace = 0;
    if (item === this.strings.controls.length) {
      assignSpace = this.remainingSpace-currentSpace
    } else {
      assignSpace = this.minWidth
    }
    return this.fb.group({
      currentInput: this.fb.control('', [Validators.required, Validators.pattern(/^[a-zA-Z()\s\u00E4\u00E5\u00F6\u00C4\u00C5\u00D6]+$/)]),
      currentWidth: this.fb.control(assignSpace),
      backgroundColor: this.fb.control('transparent'),
      savedLemgram: this.fb.control(''),
      savedWord: this.fb.control('')
    })
  }

  public removeString(index: number) {
    this.strings.removeAt(index);
    for (let item in this.strings.controls) {
      if (this.strings.controls[item].value.currentInput.length === 0 && Number(item) === this.strings.controls.length -1) {
        let currentSpace = 0;
        for (let item1 of this.strings.controls) {
          currentSpace = currentSpace + item1.value.currentWidth;
        }
        this.strings.controls[item].patchValue({"currentWidth": this.remainingSpace - currentSpace});
      }
    }
    this.simpleSearch();
  }

  public clearStrings() {
    this.strings.clear();
  }

  public resize(event, controlID) {
    this.filteredOptions = [];
    if (event.target.value === '') {
      if (controlID !== 0) {
        setTimeout(() => {
          let focusInput = document.getElementById("id_"+(controlID-1).toString())
          focusInput.focus()
        });
      } else if (controlID === 0 && this.strings.controls.length > 1) {
        this.removeString(Number(controlID))
        setTimeout(() => {
          let focusInput = document.getElementById("id_"+(controlID).toString())
          focusInput.focus()
        });
      } 
    } else {
      for (let item in this.strings.controls) {
        if (this.strings.controls[item].value['currentInput'] === '') {
          this.removeString(Number(item))
        }
      }
      if (event.data === " ") {
        if (this.strings.controls[controlID].value['savedLemgram'] === '') {
          this.strings.controls[controlID].patchValue({"savedWord": this.strings.controls[controlID].value['currentInput'].slice(0, -1)})
          this.strings.controls[controlID].patchValue({"currentInput": this.strings.controls[controlID].value['currentInput'].slice(0, -1)})
          this.strings.controls[controlID].patchValue({"backgroundColor": "lightblue"})
        }
        if (this.strings.controls[controlID].value['savedLemgram'].length > 0) {
          this.strings.controls[controlID].patchValue({"currentInput": this.strings.controls[controlID].value['currentInput'].slice(0, -1)})
          this.strings.controls[controlID].patchValue({"backgroundColor": "bisque"})
        }
        this.simpleSearch();
        this.addString(controlID); 
      } else {
        if (this.strings.controls[controlID].value['savedLemgram'].length > 0) {
          this.strings.controls[controlID].patchValue({"currentInput": event.target.value.split(' ')[0] })
        }
        this.strings.controls[controlID].patchValue({"savedLemgram": '' })
        this.strings.controls[controlID].patchValue({'savedWord': ''})
        this.strings.controls[controlID].patchValue({'backgroundColor': 'lightblue'})
        this.karpService.getLemgramFromWordForm(event.target.value.split(' ')[0]).subscribe(data => {
          this.karpResult = data;
          this.filteredOptions = this.karpResult.filter(item => !item.includes('...'));
          this.filteredOptions = this.filteredOptions.filter(item => (!item.includes("_")))
          this.filteredOptions.sort();
          this.filteredOptions = [this.filteredOptions, controlID];
        });
        this.strings.controls[controlID].patchValue({"currentWidth": Math.max(this.minWidth, (this.strings.controls[controlID].value['currentInput'].length+1) * 7)})
      }
    }    
  }

  public searchTypeChange(val) {
    this.store.dispatch({type : CHANGE_IN_ORDER, payload: !val})
  }

  public searchVectorMode(val) {
    this.store.dispatch({type : VECTOR_SEARCH_BOX, payload: !val})
  }

  private clearSimpleSearch() {
    this.asyncSelected = '';
    this.strings.clear();
    this.remainingSpace = 740;
    this.addString(-1);
    this.simpleSearch();
  }

  public selectLemgram(event, controlID) {
    for (let item in this.strings.controls) {
      if (item !== controlID) {
        if (this.strings.controls[item].value['savedWord'].length > 0) {
          this.strings.controls[item].patchValue({'currentInput': this.strings.controls[item].value['savedWord']})
        }
        if (this.strings.controls[item].value['savedLemgram'].length > 0) {
          this.strings.controls[item].patchValue({'currentInput':  this.strings.controls[item].value['savedLemgram'].split('..')[0].replace(/_/g, ' ') + ' (' 
            + this.locService.getTranslationFor(this.strings.controls[item].value['savedLemgram'].split('..')[1].split('.')[0]) + ')'})
        }
      }
    }
    this.strings.controls[controlID].patchValue({"savedLemgram": event.option.value})
    this.strings.controls[controlID].patchValue({"currentInput": event.option.value.split('..')[0].replace(/_/g, ' ') + ' (' + this.locService.getTranslationFor(event.option.value.split('..')[1].split('.')[0]) + ')'})
    this.strings.controls[controlID].patchValue({"currentWidth": (this.strings.controls[controlID].value['currentInput'].length) * 7})
    this.strings.controls[controlID].patchValue({"backgroundColor": "bisque"})
    this.addString(controlID);
    setTimeout(() => {
      this.simpleSearch();
    });
   
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
      let tempAsync = [];
      this.asyncSelected = '';
      for (let item in this.strings.value) {
        if (this.strings.value[item].savedLemgram.length > 0) {
          tempAsync.push('lemgram:'+this.strings.value[item].savedLemgram)
          this.asyncSelected = this.asyncSelected + ' ' + this.strings.value[item].savedLemgram;
        } else if (this.strings.value[item].savedWord.length > 0) {
          tempAsync.push('word:'+this.strings.value[item].savedWord) 
          this.asyncSelected = this.asyncSelected + ' ' + this.strings.value[item].savedWord;
        } else if (this.strings.value[item].currentInput.length > 0) {
          this.strings.controls[item].patchValue({"savedWord": this.strings.controls[item].value['currentInput']})
          this.strings.controls[item].patchValue({"currentInput": this.strings.controls[item].value['currentInput']})
          this.strings.controls[item].patchValue({"backgroundColor": "lightblue"})
          this.strings.controls[item].patchValue({"currentWidth": (this.strings.controls[item].value['currentInput'].length+1) * 7})
          tempAsync.push('word:'+this.strings.value[item].currentInput) 
          this.asyncSelected = this.asyncSelected + ' ' + this.strings.value[item].currentInput;
          this.addString(Number(item));
        }
      }
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
      this.store.dispatch({ type: CHANGEQUERY, payload : tempAsync.join('§').replace(/"/g, '')});
      this.store.dispatch({ type: SEARCH, payload : null});
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
