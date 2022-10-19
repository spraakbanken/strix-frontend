import { Component, OnInit, ViewChildren } from '@angular/core';
import { Subscription, Observable, zip } from 'rxjs';
import { filter, skip } from 'rxjs/operators';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import {
SEARCH, CHANGEFILTERS, CHANGE_INCLUDE_FACET,
INITIATE, OPENDOCUMENT, CLOSEDOCUMENT, AppState, OPENCOMPAREDOC, CLOSECOMPAREDOC
} from '../searchreducer';
import { Bucket, Aggregations, Agg, AggregationsResult } from "../strixresult.model";
// import { MultiCompleteComponent } from "./multicomplete/multicomplete.component";
// import { RangesliderComponent } from "./rangeslider.component";

// import {Router} from '@angular/router';
import {FormControl, Validators, ValidationErrors} from '@angular/forms';

@Component({
  selector: 'rightcolumn',
  templateUrl: 'rightcolumn.component.html',
  styleUrls: ['rightcolumn.component.css']
})
export class RightcolumnComponent implements OnInit {
  checked = false;
  indeterminate = false;

  public aggregationList3 = [];

  public corpusList = new FormControl();

  public gotMetadata = false;

  private metadataSubscription: Subscription;
  private aggregatedResultSubscription: Subscription;

  private aggregations : Aggregations = {};
  private aggregationKeys: string[] = [];
  //private currentFilters: any[] = []; // TODO: Make some interface
  private unusedFacets : string[] = [];

  public openDocument = false;
  public openCompare = false;

  public selecT = false;
  public simpleSearch = false;
  public advanceSearch = false;

  private searchRedux: Observable<any>;
  private include_facets : string[] = []
  private corpusSelected : string[] = []
  private availableCorpora : { [key: string] : StrixCorpusConfig};
  private rightSide = {}
  private corporaArray : string[] = []

  public myControl = new FormControl();


  constructor(private metadataService: MetadataService,
              private queryService: QueryService,
              private store: Store<AppState>,
              // private cd: ChangeDetectorRef
              ) {
    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.gotMetadata = true;
          this.availableCorpora = this.metadataService.getAvailableCorpora();
          // console.log("this.availableCorpora subsc--", this.availableCorpora)
        }
    });

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.pipe(filter((d) => d.latestAction === OPENDOCUMENT)).subscribe((data) => {
      this.openDocument = true;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CLOSEDOCUMENT)).subscribe((data) => {
      this.openDocument = false;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === OPENCOMPAREDOC)).subscribe((data) => {
      this.openCompare = true;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CLOSECOMPAREDOC)).subscribe((data) => {
      this.openCompare = false;
    });

    this.aggregatedResultSubscription = queryService.aggregationResult$.pipe(skip(1)).subscribe(
      (result : AggregationsResult) => {
        this.updateRightSide(result);
      },
      error => null//this.errorMessage = <any>error
    );

    /* this.searchRedux.filter((d) => d.latestAction === INITIATE).subscribe((data) => {
      console.log("SHOULD INITIATE FILTERS WITH", data.filters);
    }); */
  }

  private updateRightSide(result) {
    this.corporaArray = []; let wordArray1 = [];
    let textArray1 = []; let structArray1 = []; 
    const tempBucket = result.aggregations.corpus_id.buckets;
    this.corpusSelected = [];
    this.aggregationList3 = [];
    for (let i = 0; i < tempBucket.length; i++) {
      if (tempBucket[i].selected) {
        this.corpusSelected.push(tempBucket[i].key)
      }
    }
    if (this.corpusSelected.length == 0) {
      for (let key1 in this.availableCorpora) {
        for (let ii=0; ii<this.availableCorpora[key1].textAttributes.length; ii++) {
          textArray1.push(this.availableCorpora[key1].textAttributes[ii].name)
        }
        for (let ii=0; ii<this.availableCorpora[key1].wordAttributes.length; ii++) {
          wordArray1.push(this.availableCorpora[key1].wordAttributes[ii].name)
        }
        for (let ii=0; ii<this.availableCorpora[key1].structAttributes.length; ii++) {
          structArray1.push(this.availableCorpora[key1].structAttributes[ii].name)
        }
        this.corporaArray.push(this.availableCorpora[key1].description.eng)
      }
    } else {
      for (let j = 0; j < this.corpusSelected.length; j++) {
        for (let ii=0; ii<this.availableCorpora[this.corpusSelected[j]].textAttributes.length; ii++) {
          textArray1.push(this.availableCorpora[this.corpusSelected[j]].textAttributes[ii].name)
        }
        for (let ii=0; ii<this.availableCorpora[this.corpusSelected[j]].wordAttributes.length; ii++) {
          wordArray1.push(this.availableCorpora[this.corpusSelected[j]].wordAttributes[ii].name)
        }
        for (let ii=0; ii<this.availableCorpora[this.corpusSelected[j]].structAttributes.length; ii++) {
          structArray1.push(this.availableCorpora[this.corpusSelected[j]].structAttributes[ii].name)
        }
        this.corporaArray.push(this.availableCorpora[this.corpusSelected[j]].description.eng)
      }
    }
    this.rightSide['corpus'] = this.corporaArray;
    this.rightSide['sidebar_structural_attributes'] =_.keys(_.countBy(structArray1));
    this.rightSide['text_attributes'] = _.keys(_.countBy(textArray1));
    this.rightSide['sidebar_word_attributes'] = _.keys(_.countBy(wordArray1));
    // console.log("---------------", this.rightSide);
  }

  ngOnInit() {
    // Filtrera på INITIATE nedan
    zip(
      this.queryService.aggregationResult$,
      this.searchRedux.pipe(filter((d) => d.latestAction === INITIATE)),
      this.metadataService.loadedMetadata$

    ).subscribe(([result, {filters}, info] : [AggregationsResult, any, any]) => {
      //this.zone.run(() => {
        this.updateRightSide(result);
    })
    this.selecT = true;
  }
}

