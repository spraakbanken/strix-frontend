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
import { OPENDOCUMENT, AppState } from '../searchreducer';
import { Store } from '@ngrx/store';
import { AppComponent } from '../app.component';
import { SearchRedux } from '../searchreducer';
import { SearchResult } from 'app/strixresult.model';

@Component({
  selector: 'statdocs',
  templateUrl: 'statdocs.component.html',
  styleUrls: ['statdocs.component.css']
})

export class StatDocsComponent implements OnInit{

  @Input() data: any;
  @Input() currentTab : string;
  private similarDocs: StrixDocument[] = [];

  private searchRedux: Observable<SearchRedux>;
  public filteredData: Observable<any>;
  public filteredDataNew: any;
  public loadSimilar = false;
  public totalNumberOfDocuments : number = 0;
  public itemsPerPage: number = 5;
  public currentPaginatorPage: number = 0;

  panelOpenState = false;

  public finishLoading = false;

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
  }

  public paginatorPageChanged(event: any) {
    this.paginator.pageIndex = event.pageIndex;
    this.paginator.pageSize = event.pageSize;
    this.itemsPerPage = event.pageSize;
    let from = event.pageIndex * event.pageSize;
    let to = from + event.pageSize
    this.currentPaginatorPage = event.pageIndex;
    this.data[this.currentTab].fromPage = from;
    this.data[this.currentTab].toPage = to;
    this.getStatDocuments(this.data[this.currentTab]);
  }
  

  public getStatDocuments(docIndex: any) {
    this.loadSimilar = true;
    this.callsService.getStatDocuments(docIndex.current_corpora, docIndex.query, docIndex.filterStat, docIndex.keyword, docIndex.fromPage, docIndex.toPage).subscribe(
        (answer : SearchResult) => {
          this.similarDocs = answer.data;
          this.totalNumberOfDocuments = answer.count;
          let tempData = [];
          for(let i = 0; i < this.similarDocs.length; i++) {
            tempData.push({
                'title': this.similarDocs[i]['title'], 'text': this.similarDocs[i]['preview'], 'corpus_id': this.similarDocs[i]['corpus_id'],
                'docType': this.similarDocs[i]['doc_type'], 'tokens': this.similarDocs[i]['word_count'], 'authors': this.similarDocs[i]['text_attributes']['author'],
                'year': this.similarDocs[i]['text_attributes']['year'], 'most_common_words': this.similarDocs[i]['most_common_words'],
                'ner_tags': this.similarDocs[i]['ner_tags'], 'doc_id': this.similarDocs[i]['doc_id'], 'source_url': this.similarDocs[i]['text_attributes']['url']
            });
        }
        this.similarDocs = tempData;
        this.filteredDataNew = new MatTableDataSource<StrixDocument>(this.similarDocs);
        this.filteredData = this.filteredDataNew.connect();
        this.loadSimilar = false;
        this.finishLoading = true;
        });
  }

  public filterData() {
    let tempData = this.similarDocs;
    this.filteredDataNew = [];
    this.filteredDataNew = new MatTableDataSource<StrixDocument>(tempData);
    this.filteredDataNew.paginator = this.paginator;
    this.filteredData = this.filteredDataNew.connect();
  }

  private openDocument(docIndex: number) {
    let doc = this.similarDocs[docIndex];
    this.store.dispatch({type : OPENDOCUMENT, payload : doc});
    this.appComponent.selectedTab.setValue(this.appComponent.listTabs[0]);
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  ngOnInit() {
    this.availableCorpora = this.metadataService.getAvailableCorpora();
    this.getStatDocuments(this.data[this.currentTab]);
  }
}

