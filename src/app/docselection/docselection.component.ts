import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription, Observable, zip } from 'rxjs';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';

import { QueryService } from '../query.service';
import { DocumentsService } from '../documents.service';
import { MetadataService } from '../metadata.service';
import { StrixDocument } from '../strixdocument.model';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { OPENDOCUMENT, CHANGEPAGE, RELOAD, INITIATE, CHANGEQUERY, AppState, SearchRedux,
   CHANGEFILTERS, DOC_SIZE, WORD_COUNT, YEAR_RANGE, YEAR_INTERVAL, CHANGELANG, UNDEFINED_YEAR, SELECTED_CORPORA } from '../searchreducer';
import { SearchResult, AggregationsResult } from '../strixresult.model';
import { filter } from 'rxjs/operators';
import { AppComponent } from '../app.component';
import { Options, ChangeContext } from '@angular-slider/ngx-slider';
import { ChartOptions, ChartType } from 'chart.js';
import {PageEvent} from '@angular/material/paginator';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { LocService } from 'app/loc.service';

@Component({
  selector: 'docselection',
  templateUrl: './docselection.component.html',
  styleUrls: ['./docselection.component.css']
})
export class DocselectionComponent implements OnInit {

  private searchRedux: Observable<SearchRedux>;

  private hasSearched = false;
  private disablePaginatorEvent = false;

  private currentPaginatorPage: number = 0; // Needs to be 1-based because of the paginator widget
  private itemsPerPage: number = 10;
  public selectStatOption = 'Most common words';
  public statisticsView = 'graph';
  public zeroSelectDoc = '';
  public currentState = 0;
  pageEvent: PageEvent;

  private documentsWithHits: StrixDocument[] = [];//StrixDocHit[] = [];
  private documentsWithHitsTemp: StrixDocument[] = [];
  private totalNumberOfDocuments: number = 0;

  private textAttributes: any[] = [];
  public statData: any[] = [];
  public filterCorpora: any[] = [];

  private availableCorpora: { [key: string] : StrixCorpusConfig} = {};
  private checkedCorpora: any = {};
  private newModeData: any = {};
  public selectedCorpora: string[];

  public show = true;
  public showData = true;
  public yearRange = true;
  public yearCheck = false;
  public undefYears = true;
  public yearNA = '';

  private searchResultSubscription: Subscription;
  private metadataSubscription: Subscription;
  private gotMetadata = false;
  private statResultSubscription: Subscription;
  private aggregatedResultSubscription: Subscription;

  public barChartOptions: ChartOptions = {
    responsive: true,
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
      }
    },
    plugins: { 
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = '';
            if (context.parsed.y !== null) {
                label += context.parsed.y;
            }
            return label;
        }
        }
      }
    } 
  };
  public barChartType: ChartType = 'bar';
  public barChartLegend = false;
  public barChartPlugins = [];

  public lowerLimit: number = 0;
  public upperLimit: number = 0;
  public minToken: number = 0;
  public maxToken: number = 0;
  public optionsToken: Options = {
    floor: 1,
    ceil: 1000000
  };

  public docData = [];
  public docDataLabel = [];
  public yearData = [];
  public minYear: number = 0;
  public maxYear: number = 0;
  public options: Options = {
    floor: 0,
    ceil: 2022
  };

  constructor(private documentsService: DocumentsService,
              private queryService: QueryService,
              private metadataService: MetadataService,
              private appComponent: AppComponent,
              private locService: LocService,
              public _MatPaginatorIntl: MatPaginatorIntl,
              // private similarComponent: SimilarDocsComponent,
              private store: Store<AppState>) {
    this.searchRedux = this.store.select('searchRedux');

    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.availableCorpora = metadataService.getAvailableCorpora();
          this.gotMetadata = true;
        } else {
          this.availableCorpora = {}; // TODO: Show some error message
        }
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === INITIATE)).subscribe((data) => {
      this.currentState = 0;
    })

    this.searchRedux.pipe(filter((d) => d.latestAction === SELECTED_CORPORA)).subscribe((data) => {
      this.selectedCorpora = data.selectedCorpora;
      if (data.selectedCorpora.length > 0) {
        this.zeroSelectDoc = "not empty";
        this.currentState = this.currentState + 1;
        this.hasSearched = false;
      } else {
        this.zeroSelectDoc = "empty";
        this.currentState = this.currentState + 1;
      }
    })

    this.searchRedux.pipe(filter((d) => d.latestAction === CHANGELANG)).subscribe((data) => {
      // this.paginator._intl.itemsPerPageLabel = this.locService.getTranslationFor('docPs')
      this._MatPaginatorIntl.itemsPerPageLabel = this.locService.getTranslationFor('docPs');
    });
    this.searchRedux.pipe(filter((d) => d.latestAction === OPENDOCUMENT)).subscribe((data) => {
      // console.log("OPENDOCUMENT");
      this.documentsWithHits = [];
      this.totalNumberOfDocuments = 0;
      this.hasSearched = false;
    });
    this.searchRedux.pipe(filter((d) => d.latestAction === CHANGEQUERY)).subscribe((data) => {
      this.currentPaginatorPage = data.page
    });
    this.searchRedux.pipe(filter((d) => d.latestAction === CHANGEFILTERS)).subscribe((data) => {
      this.currentPaginatorPage = data.page
    });
    
    this.searchRedux.pipe(filter((d) => d.latestAction === WORD_COUNT)).subscribe((data) => {
      this.lowerLimit = data.wordCount[0];
      this.upperLimit = data.wordCount[1];
      this.minToken = this.lowerLimit;
      this.maxToken = this.upperLimit;
      this.setNewOptions(this.maxToken,this.minToken, 'tokenRange');
    });
    this.searchRedux.pipe(filter((d) => d.latestAction === YEAR_RANGE)).subscribe((data) => {
      this.minYear = data.yearRange[0];
      this.maxYear = data.yearRange[1];
      this.setNewOptions(this.maxYear,this.minYear, 'yearRange');
    });

    this.statResultSubscription = queryService.statResult$.subscribe(
      (result : any) => {
        this.statData = [];
        this.yearData = [];
        this.docData = [];
        let docDataTemp = [];
        let docDataLabelTemp = [];
        let dataStats = result.sort((a,b) => _.keys(b[1]).length - _.keys(a[1]).length);
        let docDataX = dataStats.filter(item => item[0] == 'word_count')
        docDataX = _.keys(docDataX[0][1])
        for (let i = 0; i < docDataX.length; i++) {
          docDataLabelTemp.push(i);
          docDataTemp.push(Number(docDataX[i]))
        }
        this.docData.push({'key': 'word_count', 'labels': docDataLabelTemp, 'values': [{'data': docDataTemp, 'label': 'Document size'}]})
        dataStats = dataStats.filter(item => item[0] != 'word_count' && ['year', 'author', 'corpus_id'].includes(item[0]))
        dataStats.forEach((item) => this.statData.push({'key': item[0], 'labels': _.keys(item[1]), 'values': [{'data': _.values(item[1]),
         'label': item[0].charAt(0).toUpperCase()+item[0].substring(1)}],
         'ttValues': _.keys(item[1]).map(function (x, i) {return [x, _.values(item[1])[i]]}).sort((a,b) => b[1] - a[1])
        }))
        if (this.statData.filter(item => item.key == 'year')) {
          this.yearData = this.statData.filter(item => item.key == 'year')
        }
        if (this.yearData.length > 0) {
          if (this.yearData[0]['labels'].includes('2050')) {
            this.yearNA = 'Yes';
          } else {
            this.yearNA = 'No';
          }
        }
        this.statData = this.statData.filter(item => item.key != 'year');        
      },
      error => null//this.errorMessage = <any>error
    );


    this.searchResultSubscription = queryService.searchResult$.subscribe(
      (answer: SearchResult) => {

        this.documentsWithHits = answer.data;
        this.totalNumberOfDocuments = answer.count;
        this.hasSearched = true;
      },
      error => null//this.errorMessage = <any>error
    );

  }

  private setPaginatorPage(page) {
    if (page !== this.currentPaginatorPage) {
      this.disablePaginatorEvent = false;
      this.currentPaginatorPage = page;
    }
  }

  public paginatorPageChanged(event: any) {
    if (! this.disablePaginatorEvent ) { 
      this.paginator.pageIndex = event.pageIndex;
      this.paginator.pageSize = event.pageSize;

      this.itemsPerPage = event.pageSize;
      this.currentPaginatorPage = event.pageIndex;
      this.store.dispatch({type : CHANGEPAGE, payload: event});
      this.store.dispatch({type : RELOAD, payload : null});
    } else {
      this.disablePaginatorEvent = false;
    }
  }

  private openDocument(docIndex: number) {
    let doc = this.documentsWithHits[docIndex];
    this.store.dispatch({type : OPENDOCUMENT, payload : doc});
  }
  private openDocumentInNew(docIndex: number) { // <- Not currently in use
    let doc = this.documentsWithHits[docIndex];
  }

  private displayCorpusInfo(docIndex: number) {
    let doc = this.documentsWithHits[docIndex];
    this.textAttributes = _.map(doc.textAttributes, (item, key) => {
      return {"key" : key, "value" : item};
    });
  }

  public showStatistics(event: string) {
    this.selectStatOption = event;
  }

  private statView() {
    if (this.statisticsView === "graph") {
      this.statisticsView = "table"
    } else if (this.statisticsView === "table") {
      this.statisticsView = "graph"
    }
  }

  private switchView(event) {
    if (event === true) {
      this.showData = false;
    } else {
      this.showData = true;
    }
  }

  private yearMode(key) {
    if (key === "slider") {
      this.yearRange = true;
      this.yearCheck = false;
    } 
    if (key === "checkbox") {
      this.yearCheck = true;
      this.yearRange = false;
      this.minYear = this.options.floor;
      this.maxYear = this.options.ceil;
      this.store.dispatch({ type: YEAR_INTERVAL, payload : ""})
    }
  }

  public addTab(docIndex: number, docType: string) {
    let doc = this.documentsWithHits[docIndex];
    this.appComponent.listTabs.push(doc.title.split(' ').slice(0,2).join(' ')+'...'); // ('DocSim-' + docIndex);
    this.appComponent.selectedTab.setValue(this.appComponent.listTabs.length - 1);
    this.appComponent.similarParam = doc;
    this.appComponent.relatedDocType = docType;
    this.appComponent.currentSelection = this.selectedCorpora;
  }

  public setNewOptions(newCeil: number, newFloor: number, optionName: string): void {
    if (optionName === "tokenRange") {
      const newOptions: Options = Object.assign({}, this.optionsToken);
      newOptions.ceil = newCeil;
      newOptions.floor = newFloor;
      this.optionsToken = newOptions;
    }
    if (optionName === "yearRange") {
      const newOptions: Options = Object.assign({}, this.options);
      newOptions.ceil = newCeil;
      newOptions.floor = newFloor;
      this.options = newOptions;
    }
  }

  public selectUndefinedYears() {
    this.store.dispatch({ type: UNDEFINED_YEAR, payload : this.undefYears})
  }

  public onTokenChange(changeContext: ChangeContext): void {
    this.lowerLimit = changeContext.value;
    this.upperLimit = changeContext.highValue;
    if (this.upperLimit > 0) {
      this.store.dispatch({ type: DOC_SIZE, payload : this.lowerLimit.toString()+"-"+this.upperLimit.toString()})
    }
  }

  public onYearChange(changeContext: ChangeContext): void {
    this.minYear = changeContext.value;
    this.maxYear = changeContext.highValue;
    if (this.upperLimit > 0) {
      this.store.dispatch({ type: YEAR_INTERVAL, payload : this.minYear.toString()+"-"+this.maxYear.toString()})
    }
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngOnInit() {
    zip(
      this.queryService.aggregationResult$,
      this.searchRedux.pipe(filter((d) => d.latestAction === INITIATE)),
    ).subscribe(([result, data] : [AggregationsResult, any]) => {
      this.setPaginatorPage(data.page);
      this.zeroSelectDoc = data.emptySelection;
    });
  }
}
