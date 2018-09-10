import { Component, OnInit } from '@angular/core';
import { Subscription, zip } from 'rxjs';
import { filter, skip } from 'rxjs/operators';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { SEARCH, CHANGEFILTERS, CHANGE_INCLUDE_FACET, INITIATE, OPENDOCUMENT, CLOSEDOCUMENT, AppState } from '../searchreducer';
import { Bucket, Aggregations, Agg, AggregationsResult } from "../strixresult.model";
// import { MultiCompleteComponent } from "./multicomplete/multicomplete.component";
// import { RangesliderComponent } from "./rangeslider.component";

// import {Router} from '@angular/router';

@Component({
  selector: 'leftcolumn',
  templateUrl: './leftcolumn.component.html',
  styleUrls: ['./leftcolumn.component.css']
})
export class LeftcolumnComponent implements OnInit {
  
  private gotMetadata = false;

  private metadataSubscription: Subscription;
  private aggregatedResultSubscription: Subscription;

  public aggregations: Aggregations = {};
  private aggregationKeys: string[] = [];
  //private currentFilters: any[] = []; // TODO: Make some interface
  private unusedFacets : string[] = [];

  private openDocument = false;

  private include_facets : string[] = []
  private availableCorpora : { [key: string] : StrixCorpusConfig};
  private mem_guessConfFromAttributeName : Function;
  

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
          console.log("this.availableCorpora subsc", this.availableCorpora)
          this.mem_guessConfFromAttributeName = _.memoize(this.guessConfFromAttributeName)
        }
    });

    this.store.select('document').subscribe(documentState => {
      this.openDocument = documentState.open;
    });

    this.aggregatedResultSubscription = queryService.aggregationResult$.pipe(skip(1)).subscribe(
      (result : AggregationsResult) => {
        this.parseAggResults(result) 
      },
      error => null//this.errorMessage = <any>error
    );
  }

  private getTypeForAgg(aggregationKey : string, agg : any) {
    if(aggregationKey == "corpus_id") {return "multicomplete"}
    let conf = this.guessConfFromAttributeName(aggregationKey)
    let ret = {
      "double" : "range"
    }[conf.type]

    if(!ret) {
      if(agg.buckets.length > 20) {
        return "multicomplete"
      } else {
        return "list"
      }
      
    } else {
      return ret
    }
  }

  private guessConfFromAttributeName(attrName : string) {
    for (let item of _.values(this.availableCorpora)) {
      for (let attrObj of item.textAttributes) {
        if (attrObj.name === attrName) {
          return attrObj
        }
      }
    }
  }

  private getLocString(aggregationKey, key) {
    if(aggregationKey == "corpus_id") {
      return this.availableCorpora[key].name
    }
    let transObj = this.mem_guessConfFromAttributeName(aggregationKey).translation_value
    if (transObj) {
      return transObj[key]
    } else {
      return key
    }
  }

  private decorateRangeType(agg: Agg) {

    agg.buckets = _.filter(agg.buckets, (item) => item.from < 4000)

    let max = _.maxBy(agg.buckets, (item) => {
      if(!_.isFinite(item.to)) {
        return -1
      }
      return item.to
    }).to
    
    agg.min = _.minBy(agg.buckets, "from").from
    agg.max = max
    agg.value = {range: {lte: agg.max, gte: agg.min}}
  }

  private onRangeChange(aggregationKey, payload) {
    console.log("onRangeChange", payload)
    // let [gte, lte] = this.aggregations[aggregationKey].value

    this.aggregations[aggregationKey].selected = true
    // this.aggregations[aggregationKey].value = payload

    this.updateFilters()
  }

  private parseAggResults(result: AggregationsResult) {
    console.log("parseAggResults", result);
    if(_.keys(result.aggregations).length < 2) {
      return
    }
    for (let key in result.aggregations) {
      let newAgg = result.aggregations[key]
      let oldAgg = this.aggregations[key]
      newAgg.buckets = _.orderBy(newAgg.buckets, "doc_count", "desc")
      // if(newAgg.type)
      newAgg.type = this.getTypeForAgg(key, newAgg)
      if(newAgg.type == "range" && oldAgg) {
        result.aggregations[key] = oldAgg
      } else if(newAgg.type == "range") {
        this.decorateRangeType(newAgg)
      }
    }
    this.decorateWithParent(result.aggregations)
    // let newAggs = _.pick(this.aggregations, _.keys(result.aggregations))

    function customizer(oldValue, newValue) {
      // merge arrays by moving old selected value to new aggs array
      if (_.isArray(oldValue)) {
        let selected : Bucket[] = _.filter(oldValue, "selected")
        let valGroups = _.groupBy(newValue, "key")
        for(let bucket of selected) {
          let target = valGroups[bucket.key]
          if(target && target.length) {
            target[0].selected = true
          } else {
            // make sure selected filters don't disappear by adding them 
            // to incoming aggs array
            newValue.push(target)
          }
        }
        return newValue
      }
    }

    this.aggregations = _.mergeWith(this.aggregations, result.aggregations, customizer)
    console.log("aggregations", this.aggregations)
    this.aggregationKeys = _(result.aggregations)
                            .omit(["datefrom", "dateto"])
                            .keys()
                            .sortBy( (key) => key === "corpus_id" ? "aaaaaa": key)
                            .value()
    this.unusedFacets = _.difference(result.unused_facets, ["datefrom", "dateto"]);
  }
  
  private chooseBucket(aggregationKey: string, bucket: Bucket) {
    bucket.selected = true

    this.updateFilters();
  }


  private purgeAllFilters() {
    //this.currentFilters = [];
    this.updateFilters();
  }
  private purgeFilter(aggregationKey: string, bucket: Bucket) {
    console.log("YES", bucket, this.aggregations, this.aggregationKeys)
    bucket.selected = false
    this.updateFilters();
  }

  private addFacet(key : string) {
    if (!this.include_facets.length) {
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
    let selectedAggs = _(this.aggregations)
                              .toPairs()
                              .filter(([aggregationKey, obj]) => obj.selected && obj.type == "range")
                              .map(([aggregationKey, obj]) => {
                                return {
                                  field: aggregationKey,
                                  value: obj.value,
                                  type : obj.type
                                }
                              })
                              .value()

    this.store.dispatch({ type: CHANGEFILTERS, payload : [...selectedBuckets, ...selectedAggs]});
    this.store.dispatch({ type: SEARCH, payload : null});
  }

  private reloadStrix() {
    window.location.href = window.location.pathname;
  }

  private decorateWithParent(aggs : Aggregations) {
    for (let key in aggs) {
      _.map(aggs[key].buckets, (item) => {
        item.parent = key
        return item
      })
    }
  }

  ngOnInit() {
    // Filtrera på INITIATE nedan
    zip(
      this.queryService.aggregationResult$,
      this.store.select('query'),
      this.metadataService.loadedMetadata$

    ).subscribe(([result, {filters}, info] : [AggregationsResult, any, any]) => {
      //this.zone.run(() => {  
        console.log("Leftcolumn init", result, filters)
        this.parseAggResults(result)
        
        let filterData = filters || [];
        // Clear all filters first (could probably be optimized)
        for (let agg in this.aggregations) {
          _.forEach(this.aggregations[agg].buckets, (bucket) => {
            if (bucket.selected) {
              console.log("Deleting bucket.selected for", bucket)
              //delete bucket.selected
              bucket.selected = false
            }
          });
        }
        // Then select from the URL data
        for (let filter of filterData) {
          console.log("filter", filter)
          if(filter.type == "range") {
            console.log("filter.value", filter.value)
            this.aggregations[filter.field].value = filter.value
          } else {
            let bucket = _.find(this.aggregations[filter.field].buckets, (item) => item.key === filter.value)
            if (bucket) {
              bucket.selected = true
            }
          }
        }

        this.aggregationKeys = _.cloneDeep(this.aggregationKeys);
        this.aggregations = _.cloneDeep(this.aggregations);
    })
  }
}

