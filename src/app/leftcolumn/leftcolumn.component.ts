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
  // @ViewChildren 
  
  private gotMetadata = false;

  //private availableCorpora: { [key: string] : StrixCorpusConfig} = {};
  //private availableCorporaKeys: string[] = [];
  //private selectedCorpusID: string = null; // TODO: Temporary
  private metadataSubscription: Subscription;
  private aggregatedResultSubscription: Subscription;

  private aggregations : Aggregations = {};
  private aggregationKeys: string[] = [];
  private currentFilters: any[] = []; // TODO: Make some interface
  private unusedFacets : string[] = [];
  /*
    field : "fieldname",
    values : ["value1", "value2"]
  */

  private openDocument = false;

  private searchRedux: Observable<any>;
  private include_facets : string[] = []
  

  constructor(private metadataService: MetadataService,
              private queryService: QueryService,
              private store: Store<AppState>
              ) {
    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.gotMetadata = true;
        }
    });

    // this.activatedRoute.queryParams.subscribe((params: Params) => {
    //   console.log("params", params)
    // });


    this.searchRedux = this.store.select('searchRedux');

    

    this.searchRedux.filter((d) => d.latestAction === OPENDOCUMENT).subscribe((data) => {
      this.openDocument = true;
    });

    this.searchRedux.filter((d) => d.latestAction === CLOSEDOCUMENT).subscribe((data) => {
      this.openDocument = false;
    });

    this.searchRedux.filter((d) => d.latestAction === SEARCH).subscribe((data) => {
      // REM: We can't use INITIATE since it's sent before the component loads, hence we use SEARCH
      /* console.log("initiate", data.corpora); 
      this.selectedCorpusID = data.corpora;
      // Take any current filters from the store and massage them so they work with the internal data model
      let filterData = data.filters || {};
      let newFilters = [];
      for(let filter of filterData) {
        console.log("filter:", filter);
        newFilters.push({
          "field" : filter.field,
          "values" : filter.values
        });
      }
      this.currentFilters = newFilters; */

      console.log("search suscribe this.aggregations", this.aggregations)

    });

    this.aggregatedResultSubscription = queryService.aggregationResult$.subscribe(
      (result : StrixResult) => {
        this.parseAggResults(result) 
      },
      error => null//this.errorMessage = <any>error
    );
  }

  
  private parseAggResults(result : StrixResult) {
    console.log("parseAggResults", result);
    this.decorateWithParent(result.aggregations)
    let newAggs = _.pick(this.aggregations, _.keys(result.aggregations))
    this.aggregations = _.merge(newAggs, result.aggregations);
    this.aggregationKeys = _.keys(_.omit(result.aggregations, ["datefrom", "dateto"]));
    this.unusedFacets = _.difference(result.unused_facets, ["datefrom", "dateto"]);
  }
  

  private chooseBucket(aggregationKey: string, bucket: Bucket) {
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


  /* private purgeCorpus() {
    this.selectedCorpusID = null;
    this.purgeAllFilters();
    this.store.dispatch({ type: CHANGECORPORA, payload : []});
    this.store.dispatch({ type: SEARCH, payload : null});
  } */

  

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
        let bucket = _.find(result.aggregations[filter.field].buckets, (item) => item.key === filter.value)
        if(bucket) {
          bucket.selected = true
        }
       }
    })

    // this.searchRedux.take(1).subscribe(([result, {filters}] : [StrixResult, [key: string] : any]) => {
      // Take any current filters from the store and massage them so they work with the internal data model
      
        
        // newFilters.push({
        //   "field" : filter.field,
        //   "value" : filter.value
        // });
      // }
      // this.currentFilters = newFilters;
    // });

    /* this.searchRedux.filter((d) => d.latestAction === CHANGEFILTERS).subscribe((data) => {
      console.log("acting upon", data.latestAction);

    }); */
  }

}
