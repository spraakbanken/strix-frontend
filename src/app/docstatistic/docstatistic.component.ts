import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { FACET_LIST, AppState, SELECTED_CORPORA} from '../searchreducer';

import { CallsService } from 'app/calls.service';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';

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
    public currentSelection = "lemgram";
    public labelList: string[];

    constructor(private store: Store<AppState>, private callsService: CallsService, public _MatPaginatorIntl: MatPaginatorIntl,) {

        this.dataSource = new MatTableDataSource([])
        this.searchRedux = this.store.select('searchRedux');

        this.searchRedux.pipe(filter((d) => d.latestAction === SELECTED_CORPORA)).subscribe((data) => {
            this.selectedCorpus = data.selectedCorpora;
            this.modeSelected = data.modeSelected[0];
            this.getFacetData('year');
        })
        this.searchRedux.pipe(filter((d) => d.latestAction === FACET_LIST)).subscribe((data) => {
        this.currentFacets = data.facet_list;
        this.currentFacets = _.pick(
            this.currentFacets, 
            ['year', 'party_name', 'blingbring', 'swefn', 'topic_topic_name', 'type', 'author', 
            'topic_author_signature', 'newspaper'])
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
        const listAttr = [];
        for (let i of this.labelList) {
            listAttr.push(i['key'])
        }
        this.callsService.getDataforFacet(this.selectedCorpus, [this.modeSelected], this.currentSelection, listAttr.slice(startNumber,endNumber)).subscribe((result) => {
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
        })
    }

    public getFacetData(item: string) {
        this.dataSource = new MatTableDataSource([]);
        this.dataSource.paginator = this.paginator;
        this.currentSelection = item;
        this.displayedColumns = [];
        this.labelList = [];
        this.displayedColumns.push('item')
        let xList = ['corpus_id'];
        xList.push(item)
        this.callsService.getFacetStatistics(this.selectedCorpus, [this.modeSelected], xList).subscribe((result) => {
            this.labelList = result.aggregations[item].buckets;
            this.getTable(0, 10)
          });
    }
  ngOnInit() {
  }
}
