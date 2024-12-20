import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import * as _ from 'lodash';
import { CallsService } from 'app/calls.service';
import { StrixDocument } from '../strixdocument.model';
import { FormControl } from '@angular/forms';
import { Options, ChangeContext } from '@angular-slider/ngx-slider';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ChartOptions, ChartType } from 'chart.js';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { LocService } from 'app/loc.service';
import { OPENDOCUMENT, AppState, VECTOR_SEARCH, CHANGELANG, INITIATE, SELECTED_CORPORA } from '../searchreducer';
import { Store } from '@ngrx/store';
import { AppComponent } from '../app.component';
import { SearchRedux } from '../searchreducer';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'vectorsearch',
  templateUrl: 'vectorsearch.component.html',
  styleUrls: ['vectorsearch.component.css']
})

export class VectorSearchComponent implements OnInit{

  // @Input() vectorString: string;
  public similarDocs: StrixDocument[] = [];
  // @Input() currentSelection: string[];

  private searchRedux: Observable<SearchRedux>;
  public filteredData: Observable<any>;
  public filteredDataNew: any;
  public loadSimilar = false;
  public selectedLanguage: string;
  public modeID: string;
  public selectedCorpora: string[];

  public authors : string[] = [];
  public authorC = new FormControl();
  public corpuses : string[] = [];
  public corpusC = new FormControl();

  panelOpenState = false;

  private touchYear = false;
  private touchToken = false;
  public finishLoading = false;

  public tokens: number[] = [];
  public lowerLimit: number = 0;
  public upperLimit: number = 0;
  public minToken: number = 0;
  public maxToken: number = 0;
  public optionsToken: Options = {
    floor: 0,
    ceil: 1000000
  };

  public years: number[] = [];
  public minYear: number = 0;
  public maxYear: number = 0;
  public options: Options = {
    floor: 0,
    ceil: 2022
  };

  public barChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      },
      tooltip: {
        displayColors: false,
        callbacks: {
          title: function(tooltipItems) {
            return ''
          },
          label: function(tooltipItems) {
            return tooltipItems['label'] + " : " + tooltipItems['formattedValue']
          },
        }
      }
    },
    scales: {
      x: {
        ticks: {
          display: false,
        },
        grid: {
          display: true,
        },
      },
      y: {
        ticks: {
          precision: 0
        },
        title: {
          display: true,
          text:this.locService.getTranslationFor('frequency')
        },
      }
    },
    onClick: (evt, chart, chartItem) => {
      if (chartItem.config.data.datasets[0].label === "Corpus") {
        this.corpusC.reset();
        this.authorC.reset();
        this.corpusC.setValue([chartItem.tooltip.title[0]]);
        this.filterData();
      }
      if (chartItem.config.data.datasets[0].label === "Author") {
        this.authorC.reset();
        this.corpusC.reset();
        this.authorC.setValue([chartItem.tooltip.title[0]]);
        this.filterData();
      }
    }
  };
  
  public yearLabels = [];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];

  public yearData = [];
  public authorData = [];
  public authorLabels = [];
  public corpusData = [];
  public corpusLabels = [];
  public documentData = [];
  public documentLabels = [];
  public vectorString = '';
  public storedString = '';

  private metadataSubscription: Subscription;
  public availableCorpora: { [key: string] : StrixCorpusConfig} = {};
  public gotMetadata = false;

  constructor(private callsService: CallsService, 
    private metadataService: MetadataService, private locService: LocService,
    private store: Store<AppState>, private appComponent: AppComponent) {
    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        
        if (wasSuccess) {
          this.availableCorpora = metadataService.getAvailableCorpora();
          this.gotMetadata = true;
        } else {
          this.availableCorpora = {}; // TODO: Show some error message
        }
    });

    this.searchRedux = this.store.select('searchRedux');

    this.selectedLanguage = this.locService.getCurrentLanguage();

    this.searchRedux.pipe(filter((d) => [CHANGELANG, INITIATE].includes(d.latestAction))).subscribe((data) => {
      this.selectedLanguage = data.lang; 
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === VECTOR_SEARCH)).subscribe((data) => {
      this.availableCorpora = this.metadataService.getAvailableCorpora();
      if (data.vectorQuery !== undefined && data.vectorQuery !== null) {
        this.vectorString = data.vectorQuery;
      } else {
        this.vectorString = '';
      }
      if (this.vectorString.length > 0 && this.storedString !== this.vectorString) {
        this.getSimilarDocuments(data.vectorQuery, data.selectedCorpora)
      }
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === SELECTED_CORPORA)).subscribe((data) => {
      this.storedString = '';
      this.modeID = data.modeSelected[0];
      this.selectedCorpora = data.selectedCorpora;
    });
  }
  

  public getSimilarDocuments(relatedDoc: string, currentS: string[]) {
    this.storedString = relatedDoc;
    this.loadSimilar = true;
    this.years = [];
    this.yearLabels = [];
    this.yearData = [];
    this.authors = [];
    this.authorData = [];
    this.authorLabels = [];
    this.corpusData = [];
    this.corpusLabels = [];
    this.corpuses = [];
    this.documentData = [];
    this.documentLabels = [];
    this.tokens = [];
    this.callsService.getVectorSearch('default', currentS, relatedDoc).subscribe(
        answer => {
          this.similarDocs = answer["data"];
          let tempData = [];
          for(let i = 0; i < this.similarDocs.length; i++) {
            if (this.similarDocs[i]['text_attributes']['author']) {
              this.authors.push(this.similarDocs[i]['text_attributes']['author']);
            }
            
            this.corpuses.push(this.similarDocs[i]['corpus_id']);
            if (typeof(this.similarDocs[i]['text_attributes']['year']) === "string") {
                this.years.push.apply(this.years, this.similarDocs[i]['text_attributes']['year'].split(', '));
            }
            this.tokens.push(this.similarDocs[i]['word_count']);
            let authors = ''
            if (_.keys(this.similarDocs[i]['text_attributes']).includes('author')) {
              authors = this.similarDocs[i]['text_attributes']['author'];
            } else {
              authors = '';
            }
            let year = '';
            if (_.keys(this.similarDocs[i]['text_attributes']).includes('year')) {
              year = this.similarDocs[i]['text_attributes']['year'];
            } else {
              year = '';
            }
            tempData.push({
                'title': this.similarDocs[i]['title'], 'preview': this.similarDocs[i]['preview'], 'corpus_id': this.similarDocs[i]['corpus_id'],
                'docType': this.similarDocs[i]['doc_type'], 'word_count': this.similarDocs[i]['word_count'], 'authors': authors,
                'year': year, 'most_common_words': this.similarDocs[i]['most_common_words'],
                'ner_tags': this.similarDocs[i]['ner_tags'], 'doc_id': this.similarDocs[i]['doc_id'], 'source_url': this.similarDocs[i]['text_attributes']['url']
            });
            if (this.modeID === 'so') {
              for (let i in tempData) {
                let word = tempData[i]['title'].split(' ')[0]
                let pos = tempData[i]['title'].split(' ')[1].replace('\)', '').replace('\(', '')
                tempData[i]['link'] = "https://spraakbanken.gu.se/karp/?mode=salex&lexicon=salex&query=and(equals%7Cortografi%7C%22"+word+"%22%7C%7Cequals%7Cordklass%7C%22"+pos+"%22)";
              }
            }
        }
        this.similarDocs = tempData;
        // this.authors = _.uniq(this.authors);
        // this.corpuses = _.uniq(this.corpuses);
        this.filteredDataNew = new MatTableDataSource<StrixDocument>(this.similarDocs);
        this.filteredDataNew.paginator = this.paginatorTop;
        this.filteredData = this.filteredDataNew.connect();
        this.loadSimilar = false;
        let authorsData = _.groupBy(this.authors.map(i=>i));
        this.authorLabels = _.keys(authorsData);
        this.authorData = [{data: _.values(authorsData).map(x => x.length), label: this.locService.getTranslationFor('authorS')}];
        let corpusesData = _.groupBy(this.corpuses.map(i=>i));
        this.corpusLabels = _.keys(corpusesData);
        this.corpusData = [{data: _.values(corpusesData).map(x => x.length), label: this.locService.getTranslationFor('corpus'), backgroundColor: ["#CCB97E"]}];
        let dataYear = _.groupBy(this.years.map(i=>Number(i)));
        this.yearLabels = _.keys(dataYear);
        this.yearData = [{data: _.values(dataYear).map(x => x.length), label: this.locService.getTranslationFor('yearS'), backgroundColor: ["#C4AB86"]}];
        this.years = this.years.map(i=>Number(i)).filter((x, i, a) => a.indexOf(x) == i).sort();
        this.minYear = this.years[0];
        this.maxYear = this.years.splice(-1)[0];
        this.setNewOptions(this.maxYear, this.minYear, 'yearRange')
        this.tokens = this.tokens.sort(function(a,b){return a-b});
        for (let i = 0; i < this.tokens.length; i++) {
          this.documentLabels.push(i);
          this.documentData.push(this.tokens[i])
        }
        this.documentData = [{data: this.documentData, label: this.locService.getTranslationFor('tokens'), backgroundColor: ["#BA9238"]}];
        this.lowerLimit = this.tokens[0]
        this.upperLimit = this.tokens.splice(-1)[0];
        this.minToken = this.lowerLimit;
        this.maxToken = this.upperLimit;
        this.setNewOptions(this.maxToken, this.minToken, 'tokenRange');
        this.finishLoading = true;
        });
  }

  public setNewOptions(newCeil: number, newFloor: number, optionName: string): void {
    // Due to change detection rules in Angular, we need to re-create the options object to apply the change
    if (optionName === 'yearRange') {
      const newOptions: Options = Object.assign({}, this.options);
      newOptions.ceil = newCeil;
      newOptions.floor = newFloor;
      this.options = newOptions;
    }
    if (optionName === "tokenRange") {
      const newOptions: Options = Object.assign({}, this.optionsToken);
      newOptions.ceil = newCeil;
      newOptions.floor = newFloor;
      this.optionsToken = newOptions;
    }
  }

  public filterData() {
    let tempData = this.similarDocs;
    const checkRange = (element) => _.inRange(element, this.minYear, this.maxYear+1);
    this.filteredDataNew = []; this.tokens = []; this.documentData = []; this.documentLabels = [];
    if (this.authorC.value !== null && this.authorC.value.length > 0) {        
        tempData = tempData.filter((x) => {return this.authorC.value.includes(x['authors']);})
    }
    if (this.corpusC.value !== null && this.corpusC.value.length > 0) {
        tempData = tempData.filter((x) => {return this.corpusC.value.includes(x['corpusID']);})
    }
    if (this.touchYear) {
    tempData = tempData.filter((x) => {if (typeof(x['year']) === 'string') {return x['year'].split(', ').map(i=>Number(i)).some(checkRange)}})
    }
    if (this.touchToken) {
        tempData = tempData.filter((x) => {return _.inRange(x['tokens'], this.lowerLimit, this.upperLimit)})
    }
    this.tokens = _.map(tempData, 'tokens');
    for (let i = 0; i < this.tokens.length; i++) {
      this.documentLabels.push(i);
      this.documentData.push(this.tokens[i])
    }
    this.documentData = [{data: this.documentData, label: this.locService.getTranslationFor('tokens'), backgroundColor: ["#BA9238"]}];
    let authorsData = _.groupBy(_.map(tempData, 'authors'));
    this.authorLabels = _.keys(authorsData);
    this.authorData = [{data: _.values(authorsData).map(x => x.length), label: this.locService.getTranslationFor('authorS')}];
    let corpusesData = _.groupBy(_.map(tempData, 'corpusID'));
    this.corpusLabels = _.keys(corpusesData);
    this.corpusData = [{data: _.values(corpusesData).map(x => x.length), label:this.locService.getTranslationFor('corpus'), backgroundColor: ["#CCB97E"]}];
    let dataYear = _.groupBy(_.concat(_.map(tempData, 'year').map(x=>x.split(', '))).map(i=>Number(i)));
    this.yearLabels = _.keys(dataYear);
    this.yearData = [{data: _.values(dataYear).map(x => x.length), label: this.locService.getTranslationFor('yearS'), backgroundColor: ["#C4AB86"]}];
    this.filteredDataNew = new MatTableDataSource<StrixDocument>(tempData);
    this.filteredDataNew.paginator = this.paginatorTop;
    this.filteredData = this.filteredDataNew.connect();
  }

  public onUserChange(changeContext: ChangeContext): void {
    this.minYear = changeContext.value;
    this.maxYear = changeContext.highValue;
    this.touchYear = true;
    this.filterData();
  }

  public onTokenChange(changeContext: ChangeContext): void {
    this.lowerLimit = changeContext.value;
    this.upperLimit = changeContext.highValue;
    this.touchToken = true;
    this.filterData();
  }

  private openDocument(docIndex: number) {
    let doc = this.similarDocs[docIndex];
    this.store.dispatch({type : OPENDOCUMENT, payload : doc});
    this.appComponent.selectedTabV.setValue(this.appComponent.listTabsV[0]);
  }

  public addTabV(doc: any, docType: string) {
    this.appComponent.listTabsV.push(doc.title.split(' ').slice(0,2).join(' ')+'...'); // ('DocSim-' + docIndex);
    this.appComponent.selectedTabV.setValue(this.appComponent.listTabsV.length - 1);
    this.appComponent.similarParam = doc;
    this.appComponent.relatedDocType = docType;
    this.appComponent.currentSelection = this.selectedCorpora;
  }

  public handlePaginatorTop(e): void {
    const { pageSize, pageIndex } = e;
    this.paginatorTop.pageSize = pageSize
    this.paginatorTop.pageIndex = pageIndex;
    this.paginatorTop.page.emit(e);
}

  public handlePaginatorBottom(e): void {
    const { pageSize, pageIndex } = e;
    this.paginatorBottom.pageSize = pageSize
    this.paginatorBottom.length = this.paginatorTop.length;
    this.paginatorBottom.pageIndex = pageIndex;
  }

  // @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('paginatorTop', { static: false }) paginatorTop: MatPaginator;
  @ViewChild('paginatorBottom', { static: false }) paginatorBottom: MatPaginator;
  
  ngAfterContentChecked(): void {
    if (this.paginatorTop) {
      this.paginatorBottom.length = this.paginatorTop.length;
    }
}

  ngOnInit() {
    this.selectedLanguage = this.locService.getCurrentLanguage();
    // this.availableCorpora = this.metadataService.getAvailableCorpora();
    // this.getSimilarDocuments(this.vectorString, this.currentSelection);
  }
}

