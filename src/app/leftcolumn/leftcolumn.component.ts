import { Component, OnInit, ViewChildren } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { SEARCH, CHANGELANG, CHANGEFILTERS, CHANGE_INCLUDE_FACET, INITIATE, OPENDOCUMENT, CLOSEDOCUMENT } from '../searchreducer';
import { StrixResult, Bucket, Aggregations } from "../strixresult.model";
import { MultiCompleteComponent } from "./multicomplete/multicomplete.component";

// import {Router} from '@angular/router';

interface AppState {
  searchRedux: any;
}

@Component({
  selector: 'leftcolumn',
  templateUrl: './leftcolumn.component.html',
  styleUrls: ['./leftcolumn.component.css']

})
export class LeftcolumnComponent implements OnInit {
  
  private gotMetadata = false;

  private metadataSubscription: Subscription;
  private aggregatedResultSubscription: Subscription;

  private aggregations : Aggregations = {};
  private aggregationKeys: string[] = [];
  private currentFilters: any[] = []; // TODO: Make some interface
  private unusedFacets : string[] = [];

  private openDocument = false;

  private searchRedux: Observable<any>;
  private include_facets : string[] = []
  private availableCorpora : { [key: string] : StrixCorpusConfig};
  private mem_guessConfFromAttributeName : Function;
  

  constructor(private metadataService: MetadataService,
              private queryService: QueryService,
              private store: Store<AppState>,
              ) {
    this.mem_guessConfFromAttributeName = _.memoize(this.guessConfFromAttributeName)
    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.gotMetadata = true;
          this.availableCorpora = this.metadataService.getAvailableCorpora();
          console.log("this.availableCorpora", this.availableCorpora)
        }
    });

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.filter((d) => d.latestAction === OPENDOCUMENT).subscribe((data) => {
      this.openDocument = true;
    });

    this.searchRedux.filter((d) => d.latestAction === CLOSEDOCUMENT).subscribe((data) => {
      this.openDocument = false;
    });

    this.aggregatedResultSubscription = queryService.aggregationResult$.subscribe(
      (result : StrixResult) => {
        this.parseAggResults(result) 
      },
      error => null//this.errorMessage = <any>error
    );
  }

  private guessConfFromAttributeName(attrName : string) {
    for(let item of _.values(this.availableCorpora)) {
      for(let attrObj of item.textAttributes) {
        if(attrObj.name === attrName) {
          return attrObj
        }
      }
    }
  }

  private getLocString(aggregationKey, key) {
    console.log("getLocString", aggregationKey, key)
    let transObj = this.mem_guessConfFromAttributeName(aggregationKey).translation_value
    if(transObj) {
      return transObj[key]
    } else {
      return key
    }
  }

  private parseAggResults(result : StrixResult) {
    console.log("parseAggResults", result);
    // console.log("result.aggregations", result.aggregations)
    for(let agg of _.values(result.aggregations)) {
      agg.buckets = _.orderBy(agg.buckets, "doc_count", "desc")
    }
    this.decorateWithParent(result.aggregations)
    let newAggs = _.pick(this.aggregations, _.keys(result.aggregations))
    this.aggregations = _.merge(newAggs, result.aggregations);
    this.aggregationKeys = _(result.aggregations)
                            .omit(["datefrom", "dateto"])
                            .keys()
                            .sortBy( (key) => key === "corpus_id" ? "aaaaaa": key)
                            .value()
    this.unusedFacets = _.difference(result.unused_facets, ["datefrom", "dateto"]);
  }
  

  private chooseBucket(aggregationKey: string, bucket: Bucket) {
    console.log("chooseBucket", aggregationKey, bucket)
    bucket.selected = true

    this.updateFilters();
  }


  private purgeAllFilters() {
    this.currentFilters = [];
    this.updateFilters();
  }
  private purgeFilter(aggregationKey: string, bucket: Bucket) {
    bucket.selected = false
    this.updateFilters();
  }

  private addFacet(key : string) {
    if(!this.include_facets.length) {
      this.include_facets = [].concat(this.aggregationKeys)
    }
    this.include_facets.push(key)
    this.store.dispatch( { type :  CHANGE_INCLUDE_FACET, payload : this.include_facets })
    this.store.dispatch({ type: SEARCH, payload : null});
  }

  private updateFilters() {

    let selectedBuckets = _(this.aggregations)
                              .values()
                              .map("buckets")
                              .flatten()
                              .filter("selected")
                              .map((item : any) => ({field: item.parent, value: item.key}))
                              .value()


    console.log("selectedBuckets", selectedBuckets)

    this.store.dispatch({ type: CHANGEFILTERS, payload : selectedBuckets});
    this.store.dispatch({ type: SEARCH, payload : null});
  }

  private reloadStrix() {
    window.location.href = window.location.pathname;
  }

  private decorateWithParent(aggs : Aggregations) {
    for(let key in aggs ) {
      _.map(aggs[key].buckets, (item) => {
        item.parent = key
        return item
      })
    }
  }

  ngOnInit() {
    Observable.zip(
      this.queryService.aggregationResult$,
      this.searchRedux
          
    ).take(1).subscribe(([result, {filters}] : [StrixResult, any]) => {
      console.log("Leftcolumn init", result, filters)
      this.parseAggResults(result)
      
      let filterData = filters || [];
      let newFilters = [];
      for(let filter of filterData) {
        let bucket = _.find(this.aggregations[filter.field].buckets, (item) => item.key === filter.value)
        console.log("bucket", bucket)
        if(bucket) {
          bucket.selected = true
        }
       }
    })
  }
}

