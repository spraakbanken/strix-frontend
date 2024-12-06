import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { FACET_LIST, AppState, SELECTED_CORPORA, CHANGEQUERY, MODE_SELECTED, SELECTEDTAB} from '../searchreducer';

import { CallsService } from 'app/calls.service';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { AppComponent } from 'app/app.component';
export interface wordData {
    item: string;
}

@Component({
  selector: 'docstatistic',
  templateUrl: 'docstatistic.component.html',
  styleUrls: ['docstatistic.component.css']
})
export class DocstatisticComponent implements OnInit {

    dataSource: MatTableDataSource<wordData>;
    displayedColumns: string[] = [];
    columnsToDisplay: string[] = this.displayedColumns.slice();

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    private searchRedux: Observable<any>;
    public currentFacets: string[];
    public selectedCorpus: string[];
    public modeSelected = '';
    public currentSelection = "";
    public labelList: string[];
    public showMessage = '';
    public excludeList: string[];
    public selectedOptions = [];
    public searchString = "";
    public loadFilterStatistic = false;
    public keywordSearch: boolean;
    public indexRef = 0;

    constructor(
        private store: Store<AppState>, 
        private callsService: CallsService,
        public _MatPaginatorIntl: MatPaginatorIntl,
        private appComponent: AppComponent) {

        this.dataSource = new MatTableDataSource([])
        this.searchRedux = this.store.select('searchRedux');

        this.searchRedux.pipe(filter((d) => d.latestAction === SELECTED_CORPORA)).subscribe((data) => {
            this.selectedCorpus = data.selectedCorpora;
            this.modeSelected = data.modeSelected[0];
            if (data.currentTab === 'statistics' && this.selectedOptions.length > 0) {
                this.getFacetData(this.selectedOptions[0])
            }
        })

        this.searchRedux.pipe(filter((d) => d.latestAction === MODE_SELECTED)).subscribe((data) => {
            this.indexRef = 0;
            this.selectedOptions = [];
            this.currentSelection = '';
            this.dataSource = new MatTableDataSource([]);
            this.dataSource.paginator = this.paginator;
            this.displayedColumns = [];
        })

        this.searchRedux.pipe(filter((d) => d.latestAction === SELECTEDTAB)).subscribe((data) => {
            if (data.currentTab === 'statistics') {
                if (this.selectedOptions.length > 0) {
                    this.getFacetData(this.selectedOptions[0])
                }
            }
        })

        this.searchRedux.pipe(filter((d) => d.latestAction === CHANGEQUERY)).subscribe((data) => {
            this.searchString = data.query;
            this.keywordSearch = data.keyword_search;
            if (data.currentTab === 'statistics') {
                this.getFacetData(this.selectedOptions[0])
            }
        });

        this.searchRedux.pipe(filter((d) => d.latestAction === FACET_LIST)).subscribe((data) => {
        this.currentFacets = data.facet_list;
        
        let tempOrder = [];
        if (data.modeSelected[0] === 'so') {
            tempOrder =  ['initial', 'pos', 'swefn', 'blingbring']
        } else {
            tempOrder = ['year', 'newspaper', 'type', 'author', 'party_name', 'swefn', 'topic_topic_name', 
                'topic_author_signature', 'blingbring', 'categories', 'month', 'initial', 'pos']
        }
        
        let tempNew = []
        for (let i of tempOrder) {
          if (_.keys(this.currentFacets).includes(i)) {
            tempNew.push({'key': i})
          }
        }
        this.currentFacets = tempNew;
        this.selectedCorpus = data.selectedCorpora;
        this.modeSelected = data.modeSelected[0];
        });
    }

    public handlePageEvent(event: PageEvent) {
        if (event.pageIndex === 0) {
            this.getTable(0,10)
        } else if ((event.pageIndex*event.pageSize)+10 >= event.length) {
            this.getTable((event.pageIndex*event.pageSize), event.length)
        } else if ((event.pageIndex*event.pageSize)+10 < event.length) {
            this.getTable((event.pageIndex*event.pageSize), (event.pageIndex*event.pageSize)+10)
        } else {
            console.log("running out of memory")
        }
    }

    public getTable(startNumber, endNumber) {
        this.loadFilterStatistic = true;
        const listAttr = [];
        for (let i of this.labelList) {
            listAttr.push(i['key'].toString())
        }
        if (_.intersection(this.selectedCorpus, ['rd-ip', 'rd-kammakt', 'rd-skfr', 'wikipedia-sv']).length > 0) {
            this.showMessage = 'Currently the data selection exceed 65k documents limit which is the reason statistics is disabled.\n This functionality will be fixed in the next updates.'
            this.excludeList = _.intersection(this.selectedCorpus, ['rd-ip', 'rd-kammakt', 'rd-skfr', 'wikipedia-sv'])
        } else {
            this.showMessage = '';
        }
        let selectedCorpusIn = _.without(this.selectedCorpus, 'rd-ip', 'rd-kammakt', 'rd-skfr', 'wikipedia-sv')

        this.callsService.getDataforFacet(selectedCorpusIn, [this.modeSelected], this.currentSelection, listAttr.slice(startNumber, endNumber), this.searchString, this.keywordSearch).subscribe((result) => {
            let tempData = result.aggregations;
            let tempNew = [];
            let tempDict = {};
            for (let i of tempData) {
                tempDict[i.key] = i.value;
            }
            for (let i of this.labelList) {
                let tempCollect = {};
                if (_.keys(tempDict).includes(i['key'])) {
                    tempCollect['item'] = i['key']
                    if (Array.isArray(tempDict[i['key']])) {
                        for (let j of tempDict[i['key']]) {
                            if (!this.displayedColumns.includes(j['key'])) {
                                this.displayedColumns.push(j['key'])
                            }
                            tempCollect[j['key']] = j['doc_count']
                        }
                    }
                } else {
                    tempCollect['item'] = i['key']
                }
                tempNew.push(tempCollect)
            }
            this.dataSource = new MatTableDataSource(tempNew);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.loadFilterStatistic = false;
        })
    }

    public showMainRow(event, event1) {
        let newObj = {};
        Object.keys(event1).forEach((key) => {
            if (event1[key] !== 0) {
                newObj[key] = event1[key];
            }
        })
        let doc = {'filterStat': [{'field': this.selectedOptions[0], 'value': event+'-0'}], 'current_corpora': this.selectedCorpus, 'query': this.searchString, 'keyword': this.keywordSearch, 'fromPage': 0, 'toPage': 5, 'sideBar': _.omit(newObj, ['item'])};
        this.appComponent.listTabs.push('--'+this.selectedOptions[0]+this.indexRef.toString()); // ('DocSim-' + docIndex);
        let tempOption = this.selectedOptions[0] + this.indexRef.toString();
        this.indexRef = this.indexRef + 1;
        this.appComponent.selectedTab.setValue(this.appComponent.listTabs.length - 1);
        this.appComponent.statParam[tempOption] = doc;
    }

    public showSubRow(event1, event2, event3) {
        if (event3 !== 0){
            let x = {};
            x[event2] = event3;
            let doc = {'filterStat': [{'field': this.selectedOptions[0], 'value': event1+'-0'}], 'current_corpora': [event2], 'query': this.searchString, 'keyword': this.keywordSearch, 'fromPage': 0, 'toPage': 5, 'sideBar': x};
            this.appComponent.listTabs.push('--'+this.selectedOptions[0]+this.indexRef.toString()); // ('DocSim-' + docIndex);
            let tempOption = this.selectedOptions[0] + this.indexRef.toString();
            this.indexRef = this.indexRef + 1;
            this.appComponent.selectedTab.setValue(this.appComponent.listTabs.length - 1);
            this.appComponent.statParam[tempOption] = doc;
        }
    }

    public getFacetData(item: string) {
        this.selectedOptions = []
        this.selectedOptions = [item]
        this.dataSource = new MatTableDataSource([]);
        this.dataSource.paginator = this.paginator;
        this.currentSelection = item;
        this.displayedColumns = [];
        this.labelList = [];
        this.displayedColumns.push('item')
        let xList = ['corpus_id'];
        xList.push(item)
        if (this.selectedCorpus.length > 0) {
            this.callsService.getFacetStatistics(this.selectedCorpus, [this.modeSelected], xList, this.searchString, this.keywordSearch, []).subscribe((result) => {
                this.labelList = result.aggregations[item].buckets;
                this.getTable(0, 10)
            });
        }   
    }
  ngOnInit() {
    this.searchRedux.pipe(filter((d) => d.latestAction === CHANGEQUERY)).subscribe((data) => {
        this.searchString = data.query;
        this.keywordSearch = data.keyword_search;
        // this.getFacetData('year')
    });
  }
}
