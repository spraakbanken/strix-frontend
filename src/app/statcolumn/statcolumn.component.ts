import { Component, OnInit } from '@angular/core';
import { Subscription, Observable, zip } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { INITIATE, OPENDOCUMENT, CLOSEDOCUMENT, AppState, VECTOR_SEARCH_BOX } from '../searchreducer';
import { Aggregations, AggregationsResult } from "../strixresult.model";
import { LocService } from '../loc.service';
import { CallsService } from 'app/calls.service';

@Component({
  selector: 'statcolumn',
  templateUrl: 'statcolumn.component.html',
  styleUrls: ['statcolumn.component.css']
})
export class StatcolumnComponent implements OnInit {

  
  public openDocument = false;

  public selecT = false;
  public simpleSearch = false;
  public advanceSearch = false;
  public vectorSearch = false;
  public gotMetadata = false;
  
  public selectType = 'searchView';
  public selectFilter = 'simpleFilter';
  public selectedTab = 'simpleSearch';

  private metadataSubscription: Subscription;
  private aggregatedResultSubscription: Subscription;

  private aggregations : Aggregations = {};
  private aggregationKeys: string[] = [];
  private aggResult : Aggregations = {};
  
  private searchRedux: Observable<any>;
  private availableCorpora : { [key: string] : StrixCorpusConfig};
  public vectorSearchActive : boolean;
  
  constructor(private metadataService: MetadataService,
              private queryService: QueryService,
              private store: Store<AppState>,
              private callsService: CallsService,
              private locService: LocService,
              // private cd: ChangeDetectorRef
              ) {
    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.gotMetadata = true;
          this.availableCorpora = this.metadataService.getAvailableCorpora();
        }
    });

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.pipe(filter((d) => d.latestAction === OPENDOCUMENT)).subscribe((data) => {
      this.openDocument = true;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CLOSEDOCUMENT)).subscribe((data) => {
      this.openDocument = false;
    });
  }

  private selectSearch(event) {
    this.selecT = false;
    this.simpleSearch = false;
    this.advanceSearch = false;
    this.vectorSearch = false;
    if (event === "simpleSearch") {
      this.simpleSearch = true;
      this.vectorSearchActive = false;
      this.selectedTab = "simpleSearch";
      this.store.dispatch({type : VECTOR_SEARCH_BOX, payload: false});
    }
    if (event === "advanceSearch") {
      this.advanceSearch = true;
      this.selectedTab = "advanceSearch";
    }
    if (event === "vectorSearch") {
      this.vectorSearch = true;
      this.vectorSearchActive = true;
      this.selectedTab = "vectorSearch";
      this.store.dispatch({type : VECTOR_SEARCH_BOX, payload: true});
    }
    
  }

  ngOnInit() {
    // Filtrera på INITIATE nedan
    zip(
      this.queryService.aggregationResult$,
      this.searchRedux.pipe(filter((d) => d.latestAction === INITIATE)),
      this.metadataService.loadedMetadata$

    ).subscribe(([result, {filters}, info] : [AggregationsResult, any, any]) => {
    })
    this.simpleSearch = true;
    this.vectorSearchActive = false;
  }
}
