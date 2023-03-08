import { Component, OnInit } from '@angular/core';
import { Subscription, Observable, zip } from 'rxjs';
import { filter, skip } from 'rxjs/operators';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import {
SEARCH, CHANGEFILTERS, CHANGE_INCLUDE_FACET, MODE_SELECTED, OPENDOCUMENT, CLOSEDOCUMENT, AppState, SELECTED_CORPORA, YEAR_INTERVAL,
} from '../searchreducer';
import { Bucket, Aggregations, Agg, AggregationsResult } from "../strixresult.model";
import {FormControl, FormArray} from '@angular/forms';
import { CallsService } from 'app/calls.service';

@Component({
  selector: 'filterdata',
  templateUrl: 'filterdata.component.html',
  styleUrls: ['filterdata.component.css']
})
export class FilterdataComponent implements OnInit {

  public modeSelected = ''; 
  public searchText = '';
  public searchTextX = '';
  public resultFacet = {};
  public selectedCorpus = [];
  public selectedFilters = [];
  public yearInterval = "";
  public openDocument = false;

  public basicFilter = false;
  public advanceFilter = false; 
  public gotMetadata = false;
  public showFilters = false; 

  public bucketsInMode = [];
  private currentMode = 'default';
  private getInc = 0;

  public filterList : string[] = [];

  public selectFilter = 'basicFilter';
  public selectedTab = 'basicFilter'; 
  public selectedOptions: string[] = ['year', 'blingbring', 'swefn'];

  private metadataSubscription: Subscription; 
  private aggregatedResultSubscription: Subscription;

  private aggregations : Aggregations = {}; 
  private aggregationKeys: string[] = []; 
  
  private unusedFacets : string[] = []; 
  public basicFacets = {};
  public advanceFacets = {}; 
  public extendedFacets = {};

  private searchRedux: Observable<any>;
  public include_facets : string[] = [];
  private availableCorpora : { [key: string] : StrixCorpusConfig};
  public dataFromMode = {};
 
  // private currentFilters: any[] = []; // TODO: Make some interface

  public collectControl = new FormArray([]);
  public collectX = [];
  public collectControlX = new FormArray([]);
  public filterDataBasic = [];
  public filterDataBasicX = [];
  public filterDataAdvance = [];


  constructor(private metadataService: MetadataService,
              private queryService: QueryService,
              private store: Store<AppState>,
              private callsService: CallsService,
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

    this.searchRedux.pipe(filter((d) => d.latestAction === YEAR_INTERVAL)).subscribe((data) => {
      this.yearInterval = data.yearInterval;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === MODE_SELECTED)).subscribe((data) => {
      for (let item of this.selectedFilters) {
        this.removeFilter(item.aggsName, item.key, item.filterID);
      }
      this.resetIncludeFacets();
      this.deselectFacets();
      this.basicFacets = {};
      this.modeSelected = data.modeSelected[0];
      this.selectedCorpus = data.corporaInMode[0];
      this.yearInterval = "";
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === SELECTED_CORPORA)).subscribe((data) => {
      this.selectedCorpus = data.selectedCorpora;
      for (let item of this.selectedFilters) {
        this.removeFilter(item.aggsName, item.key, item.filterID);
      }
      this.deselectFacets();
      this.basicFacets = {};
      this.modeSelected = data.modeSelected[0];
      this.filterDataBasic = [];
      this.collectControl = new FormArray([]);
      this.collectX = [];
      this.callsService.getModeStatistics(this.selectedCorpus, data.modeSelected).subscribe((result) => {
        this.dataFromMode = {};
        this.dataFromMode  = result.aggregations;
        this.resultFacet = result.list_facet
        if (this.dataFromMode['year']) {
          let yearRange = this.dataFromMode['year'].buckets.filter(item => item.doc_count != 0)
          let newYearRange = []
          for (let i of _.map(yearRange, 'key')) {
            newYearRange.push.apply(newYearRange, i.replace(/[^0-9.]/g, '$').replace(/\$+/g, ',').split(','))
          }
          let yearRangeX = _.uniq(_.remove(newYearRange, function(n) { return n.length > 0})).sort((a,b) => (a as any) - (b as any));
          // if (yearRangeX.includes('2050')) {
          //   this.store.dispatch({ type: YEAR_NA, payload: true})
          // } else {
          //   this.store.dispatch({ type: YEAR_NA, payload: false})
          // }
          let x1 = Number(yearRangeX[0]);
          // let y1 = Number(yearRangeX.splice(-2)[0]);
          let y1 = 0;
          if (yearRangeX.includes('2050')) {
            y1 = Number(yearRangeX.splice(-2)[0]);
          } else {
            y1 = Number(yearRangeX.splice(-1)[0]);
          }
        }
        let wordCount = this.dataFromMode['word_count'].buckets.filter(item => item.doc_count != 0)
        wordCount = _.map(wordCount, 'key').sort((a,b) => (a as any) - (b as any))
        let x = wordCount[0];
        let y = wordCount.splice(-1)[0];
        this.decorateWithParent(this.dataFromMode);
        this.updatedData();
        this.runFilter();
      });
      setTimeout(() => {
        this.selectSearch('basicFilter');
      }, 2000);
    });

    this.aggregatedResultSubscription = queryService.aggregationResult$.pipe(skip(1)).subscribe(
      (result : AggregationsResult) => {
        this.parseSubAggStats(result)
      },
      error => null//this.errorMessage = <any>error
    );
  }

  public onSearchText() {
    let resultFacetX = {};
    for (let key in this.basicFacets) {
      if (key.includes(this.searchText)) {
        resultFacetX[key] = this.basicFacets[key]
      }
    }
    this.resultFacet = resultFacetX;
  }

  public changeFilter(event) {
      this.selectFilter = event;
  }

  public onChange(event, aggsName){
    if (event.checked) {
      this.addAllFilter(aggsName)
    }
    if (!event.checked) {
      this.removeAllFilter(aggsName)
    }
 }

  public selectChange(event) {
    this.runFilter();
  }

  public selectFacet(event) {
    if (event.options[0].selected) {
        this.chooseFacet(event.options[0].value)
    } else {
        this.removeFacet(event.options[0].value)
    }
  }

  private runFilter() {
    this.selectedFilters = [];
    for (let agg in this.aggregations) {
      if (agg !== 'corpus_id') {
        _.forEach(this.aggregations[agg].buckets, (bucket) => {
          if (bucket !== undefined) {
          if (bucket.selected) {
            bucket.selected = false
          }
        }
        });
      }
    }
    for (let agg in this.aggregations) {
      if (agg === 'corpus_id') {
        _.forEach(this.aggregations[agg].buckets, (bucket) => {
          if (bucket !== undefined) {
            if (bucket.selected) {
              bucket.selected = false
            }
          } 
        });
      }
    }

    this.aggregations = _.cloneDeep(this.dataFromMode);
    for (let item of this.aggregations.corpus_id.buckets) {
      if (this.selectedCorpus.includes(item.key)) {
        item.selected = true;
        } 
    }
    for (let item = 0; item < this.filterDataBasic.length; item++) {
      for (let bucket of this.aggregations[this.filterDataBasic[item]['id']].buckets) {
        if (this.collectControl.controls[item].value !== null && this.collectControl.controls[item].value.length > 0 && this.collectControl.controls[item].value.includes(bucket.key)) {
          bucket.selected = true;
          this.selectedFilters.push({'aggsName' : this.filterDataBasic[item]['id'], 'key': bucket.key, 'filterID': 'basic', 'color': 'lightblue'})
          this.collectX[item] = true;
        }
      }
    }
    for (let item = 0; item < this.filterDataAdvance.length; item++) {
      for (let bucket of this.aggregations[this.filterDataAdvance[item]['id']].buckets) {
        if (this.collectControlX.controls[item].value !== null && this.collectControlX.controls[item].value.length > 0 && this.collectControlX.controls[item].value.includes(bucket.key)) {
          bucket.selected = true;
          this.selectedFilters.push({'aggsName' : this.filterDataAdvance[item]['id'], 'key': bucket.key, 'filterID': 'advance', 'color': 'rgb(169, 222, 117)'})
        }
      }
    }
    this.updateFilters();
  }

  private getTypeForAgg(aggregationKey : string, agg : any) {
    if(aggregationKey == "corpus_id") {return "multicomplete"}
    if(aggregationKey == "mode_id") {return "multicomplete"}
    if(aggregationKey == "word_count") {return "multicomplete"}
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

  private decorateWithParent(aggs : Aggregations) {
    for (let key in aggs) {
      _.map(aggs[key].buckets, (item) => {
        item.parent = key
        return item
      })
    }
  }

  private parseSubAggStats(result: AggregationsResult) {
    if(_.keys(result.aggregations).length < 2) {
      return
    }
    for (let key in result.aggregations) {
      let newAgg = result.aggregations[key]
      let oldAgg = this.aggregations[key]
      newAgg.buckets = _.orderBy(newAgg.buckets, "doc_count", "desc")
      newAgg.type = this.getTypeForAgg(key, newAgg)
      if(newAgg.type == "range" && oldAgg) {
        result.aggregations[key] = oldAgg
      } else if(newAgg.type == "range") {
        this.decorateRangeType(newAgg)
      }
    }
    this.decorateWithParent(result.aggregations)

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
    this.aggregationKeys = [];
    this.aggregationKeys = _(result.aggregations)
                            .omit(["datefrom", "dateto"])
                            .keys()
                            .sortBy( (key) => key === "corpus_id" ? "aaaaaa": key)
                            .value()
    this.unusedFacets = _.difference(result.unused_facets, ["datefrom", "dateto"]);
    this.aggregationKeys.push.apply(this.aggregationKeys, this.unusedFacets);
    this.bucketsInMode = [];
    this.bucketsInMode = this.aggregations['corpus_id']['buckets'];

    let excludeBucket = ['word_count', 'corpus_id', 'mode_id']
  
    this.basicFacets = {};
    this.advanceFacets = {};
    this.extendedFacets = {};
    for (let facet of this.aggregationKeys) {
    if (!excludeBucket.includes(facet)) {
        if (this.aggregations[facet].type === 'range') {
        this.extendedFacets[facet] = false;
        } else {
        this.basicFacets[facet] = false;
        }
    } 
    }
  }

  public removeAllFilter(aggsName) {
    for (let item = 0; item < this.filterDataBasic.length; item++) {
      if (this.filterDataBasic[item]['id'] === aggsName) {
        this.collectControl.controls[item].setValue([]);
      }
    }
    this.selectChange("change");
  }

  public sortName(aggsName) {
    for (let item = 0; item < this.filterDataBasic.length; item++) {
      if (this.filterDataBasic[item]['id'] === aggsName) {
        if (this.filterDataBasic[item]['sortChar'] === 'desc') {
          this.filterDataBasic[item]['data'].buckets = _.orderBy(this.filterDataBasic[item]['data'].buckets, 'key', [this.filterDataBasic[item]['sortChar']]);
          this.filterDataBasic[item]['sortChar'] = 'asc'
        } else if (this.filterDataBasic[item]['sortChar'] === 'asc'){
          this.filterDataBasic[item]['data'].buckets = _.orderBy(this.filterDataBasic[item]['data'].buckets, 'key', [this.filterDataBasic[item]['sortChar']]);
          this.filterDataBasic[item]['sortChar'] = 'desc'
        }
        
      }
    }
  }

  public sortCount(aggsName) {
    for (let item = 0; item < this.filterDataBasic.length; item++) {
      if (this.filterDataBasic[item]['id'] === aggsName) {
        if (this.filterDataBasic[item]['sortNumber'] === 'desc') {
          this.filterDataBasic[item]['data'].buckets = _.orderBy(this.filterDataBasic[item]['data'].buckets, 'doc_count', [this.filterDataBasic[item]['sortNumber']]);
          this.filterDataBasic[item]['sortNumber'] = 'asc'
        } else if (this.filterDataBasic[item]['sortNumber'] === 'asc'){
          this.filterDataBasic[item]['data'].buckets = _.orderBy(this.filterDataBasic[item]['data'].buckets, 'doc_count', [this.filterDataBasic[item]['sortNumber']]);
          this.filterDataBasic[item]['sortNumber'] = 'desc'
        }
      }
    }
  }

  public addAllFilter(aggsName) {
    for (let item = 0; item < this.filterDataBasic.length; item++) {
      if (this.filterDataBasic[item]['id'] === aggsName) {
        const alterArray = [];
        for (let i of this.filterDataBasic[item]['data'].buckets) {
          alterArray.push(i.key)
        }
        this.collectControl.controls[item].setValue(alterArray);
      }
    }
    this.selectChange("change");
  } 

  public removeFilter(aggsName, key, filterID) {
    if (filterID === 'basic') {
      for (let item = 0; item < this.filterDataBasic.length; item++) {
        if (this.filterDataBasic[item]['id'] === aggsName) {
          const alterArray = this.collectControl.controls[item].value.filter((option) => {
            return option != key;
          });
          this.collectControl.controls[item].setValue(alterArray);
        }
      }
    }
    if (filterID === 'advance') {
      for (let item = 0; item < this.filterDataAdvance.length; item++) {
        if (this.filterDataAdvance[item]['id'] === aggsName) {
          const alterArray = this.collectControlX.controls[item].value.filter((option) => {
            return option != key;
          });
          this.collectControlX.controls[item].setValue(alterArray);
        }
      }
    }
    this.selectChange("change");
  }

  private updatedData() {
    for (let agg in this.aggregations) {
      if (agg !== 'corpus_id') {
        _.forEach(this.aggregations[agg].buckets, (bucket) => {
          if (bucket !== undefined) {
          if (bucket.selected) {
            bucket.selected = false
          }
        }
        });
      }
    }
    for (let agg in this.aggregations) {
      if (agg === 'corpus_id') {
        _.forEach(this.aggregations[agg].buckets, (bucket) => {
          if (bucket !== undefined) {
            if (this.selectedCorpus.includes(bucket.key)) {
                bucket.selected = true;
            }
          } 
        });
      }
    }
    this.updateFilters();
  }

  private updateFilters() {
    if (this.selectedFilters.length > 0) {
      this.showFilters = true;
    } else {
      this.showFilters = false;
    }
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
    if (this.yearInterval) {
      selectedBuckets = selectedBuckets.filter(item => item.field != 'yearR')
      selectedBuckets.push({"field": "yearR", "value": this.yearInterval})
    if (!this.yearInterval) {
      selectedBuckets = selectedBuckets.filter(item => item.field != 'yearR')
      // selectedBuckets.push({"field": "docSize", "value": this.documentSize})
      }
    }
    this.store.dispatch({ type: CHANGEFILTERS, payload : [...selectedBuckets, ...selectedAggs]});
    this.store.dispatch({ type: SEARCH, payload : null});
  }

  private purgeFilter(aggregationKey: string, bucket: Bucket) {
    bucket.selected = true;
  }

  private chooseFacet(key : string) {
    if (this.include_facets.length) {
      this.include_facets = Object.assign([], this.include_facets);
    }
    if (!this.include_facets.length) {
      this.include_facets = [].concat(['corpus_id']) // this.aggregationKeys
    }
    this.include_facets.push(key)
    this.store.dispatch( { type :  CHANGE_INCLUDE_FACET, payload : this.include_facets })
    if (_.keys(this.basicFacets).includes(key)) {
      this.basicFacets[key] = true;
      this.addCollectControl(key, 'basic');
    }
    else if (_.keys(this.advanceFacets).includes(key)) {
      this.advanceFacets[key] = true;
      this.addCollectControl(key, 'advance');
    }
    else if (_.keys(this.extendedFacets).includes(key)) {
      this.extendedFacets[key] = true;
    } else {
      console.log("Nothing added")
    }

    this.filterList.push(key);
  }

  private addCollectControl(key : string, getString : string) {
    setTimeout(() => {
      for (let item in this.aggregations) {
        if (item === key && getString === 'basic') {
          this.filterDataBasic.push({'id':key, 'data': this.dataFromMode[item], 'sortChar' : 'desc', 'sortNumber' : 'desc'});
          this.collectControl.push( new FormControl());
          this.filterDataBasicX.push({'id':key, 'data': this.dataFromMode[item], 'sortChar' : 'desc', 'sortNumber' : 'desc'})
        }
        if (item === key && getString === 'advance') {
          this.filterDataAdvance.push({'id':key, 'data': this.dataFromMode[item]});
          this.collectControlX.push( new FormControl());
        }
      }
    }, 200);
  }

  private removeFacet(key : string) {
    if (_.keys(this.basicFacets).includes(key)) {
      this.basicFacets[key] = false;
      this.deleteCollectControl(key, 'basic');
    }
    else if (_.keys(this.advanceFacets).includes(key)) {
      this.advanceFacets[key] = false;
      this.deleteCollectControl(key, 'advance');
    }
    else if (_.keys(this.extendedFacets).includes(key)) {
      this.extendedFacets[key] = false;
    } else {
       console.log("Nothing matches")
    }
    this.filterList = this.filterList.filter(item => item !== key);
  }

  private deleteCollectControl(key : string, getString : string) {
    if (getString === 'basic') {
      for (let i = 0; i < this.filterDataBasic.length; i++) {
        if (this.filterDataBasic[i].id === key) {
          this.collectControl.removeAt(i)
          this.filterDataBasic.splice(i, 1)
          this.filterDataBasicX.splice(i, 1)          
        }
      }
    }
    if (getString === 'advance') {
      for (let i = 0; i < this.filterDataAdvance.length; i++) {
        if (this.filterDataAdvance[i].id === key) {
          this.collectControlX.removeAt(i)
          this.filterDataAdvance.splice(i, 1)
          
        }
      }
    }
    this.runFilter();
    this.include_facets = this.include_facets.filter(item => item !== key);
    this.store.dispatch( { type :  CHANGE_INCLUDE_FACET, payload : this.include_facets })
    // this.store.dispatch({ type: SEARCH, payload : null});
  }

  private resetIncludeFacets() {
    this.store.dispatch({ type: CHANGE_INCLUDE_FACET, payload: []});
  }

  private defaultFacets() {
    for (let item of _.keys(this.basicFacets)) {
      if (["blingbring", "party", "year", "swefn"].includes(item)) {
          this.chooseFacet(item);
      }
  }
  }

  private deselectFacets() {
    for (let item of _.keys(this.basicFacets)) {
      this.removeFacet(item)
      }
  }

  private selectSearch(event) {
    this.basicFilter = false;
    this.advanceFilter = false;
    if (event === "basicFilter") {
      this.basicFilter = true;
      this.selectedTab = "basicFilter";
      if (!_.some(this.basicFacets)) {
        for (let item of _.keys(this.basicFacets)) {
            if (["blingbring", "party", "year", "swefn"].includes(item)) {
              this.selectedOptions.push(item);
                this.chooseFacet(item);
            }
        }
      }
    }
    if (event === "advanceFilter") {
      this.advanceFilter = true;
    }
  }

  ngOnInit() {
    // Filtrera på INITIATE nedan
    zip(
      this.queryService.aggregationResult$,
      this.searchRedux.pipe(filter((d) => d.latestAction === SELECTED_CORPORA)),
      this.metadataService.loadedMetadata$

    ).subscribe(([result, {filters}, info] : [AggregationsResult, any, any]) => {
        this.parseSubAggStats(result);
        this.updatedData();
        let _filterData = filters || [];
        // Clear all filters first (could probably be optimized)
        for (let agg in this.aggregations) {
          _.forEach(this.aggregations[agg].buckets, (bucket) => {
            if (bucket.selected) {
              //delete bucket.selected
              bucket.selected = false
            }
          });
        }
        // Then select from the URL data
        for (let filter of _filterData) {
          if(filter.type == "range") {
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
    this.basicFilter = true;
  }
}
