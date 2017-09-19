import { Component, OnInit } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { LocService } from '../loc.service';
import { SEARCH, CHANGELANG, CHANGEFILTERS, CHANGE_INCLUDE_FACET, INITIATE, OPENDOCUMENT, CLOSEDOCUMENT } from '../searchreducer';
import { StrixResult, Bucket, Aggregations } from "../strixresult.model";

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
  private typeaheadSelected : string;

  constructor(private metadataService: MetadataService,
              private queryService: QueryService,
              private store: Store<AppState>,
              private locService: LocService) {
    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.gotMetadata = true;
        }
    });

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
      (answer : StrixResult) => {
        console.log("leftcolumn answer", answer);
        // Make use of the aggregations
        // for(let key in answer.aggregations ) {
        //   _.map(answer.aggregations[key].buckets, (item) => {
        //     item.parent = key
        //     return item
        //   })

        // }
        this.decorateWithParent(answer.aggregations)
        let newAggs = _.pick(this.aggregations, _.keys(answer.aggregations))
        this.aggregations = _.merge(newAggs, answer.aggregations);
        this.aggregationKeys = _.keys(_.omit(answer.aggregations, ["datefrom", "dateto"]));
        console.log("aggregationKeys >", this.aggregationKeys);
        this.unusedFacets = _.difference(answer.unused_facets, ["datefrom", "dateto"]);

        //this.documentsWithHits = answer.data;
        //this.totalNumberOfDocuments = answer.count;
        //this.isLoading = false;
      },
      error => null//this.errorMessage = <any>error
    );



  }

  private getSelectArray(aggKey) : Bucket[] {
    return _.reject(this.aggregations[aggKey].buckets, 'selected')
  }

  private listDropdownSelected(aggKey) : Bucket[] {
    return _.filter(this.aggregations[aggKey].buckets, "selected")
  }

  private dropdownSelected(selectedItem, aggKey) {
    console.log("dropdownSelected", selectedItem)
    let bucket : Bucket = _.find(this.getSelectArray(aggKey), (item) => item.key == selectedItem.item.key)
    this.chooseBucket(aggKey, bucket)
    this.typeaheadSelected = ""
  }

  private onInputClick(event) {
    event.target.scrollIntoView()
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
      console.log("zip take 1", result, filters)

      this.decorateWithParent(result.aggregations)
      
      this.aggregations = result.aggregations;
      this.aggregationKeys = _.keys(_.omit(this.aggregations, ["datefrom", "dateto"]));

      this.unusedFacets = _.difference(result.unused_facets, ["datefrom", "dateto"]);

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
