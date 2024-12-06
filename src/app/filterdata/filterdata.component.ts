import { Component, OnInit } from '@angular/core';
import { Subscription, Observable, zip } from 'rxjs';
import { filter, skip } from 'rxjs/operators';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import {
SEARCH, CHANGEFILTERS, CHANGE_INCLUDE_FACET, MODE_SELECTED, OPENDOCUMENT, CLOSEDOCUMENT, AppState, SELECTED_CORPORA, 
YEAR_INTERVAL, FACET_LIST, CHANGEQUERY
} from '../searchreducer';
import { Bucket, Aggregations, Agg, AggregationsResult, SearchResult } from "../strixresult.model";
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
  public resultFacet = [];
  public facetList = {};
  public selectedCorpus = [];
  public selectedFilters = [];
  public selectedFiltersX = [];
  public negationStatus = {};
  public yearInterval = "";
  public openDocument = false;
  public loadFilter = false;

  public basicFilter = false;
  public advanceFilter = false; 
  public gotMetadata = false;
  public showFilters = false; 
  public showFiltersX = false;
  public holdFacets : string[] = [];
  public searchQuery : string = '';

  public bucketsInMode = [];
  private currentMode = 'default';
  private getInc = 0;

  public filterList : string[] = [];
  public newKey = '';

  public selectFilter = 'basicFilter';
  public selectedTab = 'basicFilter'; 
  public selectedOptions: string[] = [];

  private metadataSubscription: Subscription; 
  private aggregatedResultSubscription: Subscription;
  private searchResultSubscription: Subscription;

  private observeFilter = new Observable((subscriber) => {
    subscriber.next();
  })

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
  public dataFromFacet = {};
 
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
      for (let item of this.selectedFiltersX) {
        this.removeFilterX(item.aggsName, item.key, item.filterID);
      }
      this.resetIncludeFacets();
      this.deselectFacets();
      this.basicFacets = {};
      this.modeSelected = data.modeSelected[0];
      this.selectedCorpus = data.corporaInMode[0];
      this.yearInterval = "";
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CHANGE_INCLUDE_FACET)).subscribe((data) => {
      if (data.include_facets.length > 0 && this.selectedCorpus.length > 0) {
        this.callsService.getFacetStatistics(this.selectedCorpus, data.modeSelected, data.include_facets, data.query, data.keyword_search, data.filters).subscribe((result) => {
          this.dataFromFacet = {};
          this.dataFromFacet  = result.aggregations;
          // console.log("Step 1", this.dataFromFacet)
          this.decorateWithParent(this.dataFromFacet);
          this.runFilter();
        });
      }
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CHANGEQUERY)).subscribe((data) => {
      this.searchQuery = data.query;
      this.holdFacets = data.include_facets.filter(item => item != 'corpus_id');
      if (data.include_facets.length > 0 && this.selectedCorpus.length > 0) {
        this.callsService.getFacetStatistics(this.selectedCorpus, data.modeSelected, data.include_facets, data.query, data.keyword_search, data.filters).subscribe((result) => {
          this.dataFromFacet = {};
          this.dataFromFacet  = result.aggregations;
          this.decorateWithParent(this.dataFromFacet);
          // this.runFilter();
        });
      }
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === SELECTED_CORPORA)).subscribe((data) => {
      this.selectedCorpus = data.selectedCorpora;
      for (let item of this.selectedFilters) {
        this.removeFilter(item.aggsName, item.key, item.filterID);
      }
      for (let item of this.selectedFiltersX) {
        this.removeFilterX(item.aggsName, item.key, item.filterID);
      }
      this.deselectFacets();
      this.basicFacets = {};
      this.modeSelected = data.modeSelected[0];
      this.filterDataBasic = [];
      this.holdFacets = [];
      this.collectControl = new FormArray([]);
      this.collectX = [];
      this.resultFacet = [];
      this.availableCorpora = this.metadataService.getAvailableCorpora();
      let resultFacets = {}
      for (let item of this.selectedCorpus) {
        if (_.keys(this.availableCorpora).includes(item)) {
          for (let textAttr of this.availableCorpora[item].textAttributes) {
            if (!_.keys(resultFacets).includes(textAttr.name)) {
              resultFacets[textAttr.name] = textAttr.translation_name
            }
          }
        }
      }

      let tempOrder = []
      if (data.modeSelected[0] === 'so') {
        tempOrder =  ['initial', 'pos', 'swefn', 'blingbring']
      } else {
        tempOrder = ['year', 'newspaper', 'type', 'author', 'party_name', 'swefn', 'topic_topic_name', 
            'topic_author_signature', 'blingbring', 'categories', 'month', 'initial', 'pos']
      }
      let tempNew = []
      for (let i of tempOrder) {
        if (_.keys(resultFacets).includes(i)) {
          tempNew.push({'key':i, 'value':resultFacets[i]})
        }
      }
      this.resultFacet = tempNew;
      this.store.dispatch( { type :  FACET_LIST, payload : resultFacets })
      this.defaultFacetsNew();
    });

    this.searchResultSubscription = queryService.searchResult$.subscribe(
      (answer: SearchResult) => {
        if (this.filterDataBasic.length > 0) {
          this.loadFilter = true;
        }
        setTimeout(() => {
          this.observeFilter.subscribe(() => {
            this.defaultFacets();
         })
        }, 4000);
      },
      error => null//this.errorMessage = <any>error
    );

    this.aggregatedResultSubscription = queryService.aggregationResult$.pipe(skip(1)).subscribe(
      (result : AggregationsResult) => {
        this.parseSubAggStats(result)
      },
      error => null//this.errorMessage = <any>error
    );
  }

  public changeFilter(event) {
      this.selectFilter = event;
  }

  public selectChange(event, negStatus, aggId, key) {
    if (event === 'jumptoRunFilter') {
      this.runFilter();
    } else if (_.keys(this.negationStatus).includes(key)) {
      if (negStatus === 'exclude' && this.negationStatus[key]['aggsName'] === aggId && this.negationStatus[key]['status'] === 'include') {
        for (let item = 0; item < this.filterDataBasic.length; item++) {
          if (this.filterDataBasic[item]['id'] === aggId) {
            const alterArray = this.collectControl.controls[item].value.filter((option) => {
              return option != key;
            });
            this.collectControl.controls[item].setValue(alterArray);
          }
        } 
        this.runFilter();
      } else if (negStatus === 'include' && this.negationStatus[key]['aggsName'] === aggId && this.negationStatus[key]['status'] === 'exclude') {
        for (let item = 0; item < this.filterDataBasic.length; item++) {
          if (this.filterDataBasic[item]['id'] === aggId) {
            const alterArray = this.collectControlX.controls[item].value.filter((option) => {
              return option != key;
            });
            this.collectControlX.controls[item].setValue(alterArray);
          }
        }
        this.runFilter();
      } else {
        this.negationStatus = _.omit(this.negationStatus, key)
        this.runFilter();
      }
    }
    else {
      this.runFilter();
    }
    this.store.dispatch( { type :  CHANGEQUERY, payload : this.searchQuery })
  }

  public selectFacet(event) {
    // console.log(event.options)
    if (event.options[0].selected) {
      if (this.updataFacet(event.options[0].value)) {
        this.loadFilter = true;
        this.chooseFacet(event.options[0].value)
      }   
    } else {
      this.removeFacet(event.options[0].value)
    }
  }

  private updataFacet(item) {
    if (this.include_facets.length) {
      this.include_facets = Object.assign([], this.include_facets);
    }
    if (!this.include_facets.length) {
      this.include_facets = [].concat(['corpus_id']) // this.aggregationKeys
    }
    this.include_facets.push(item)
    if (!_.keys(this.basicFacets).includes(item)) {
      this.basicFacets[item] = true
    }
    this.store.dispatch( { type :  CHANGE_INCLUDE_FACET, payload : this.include_facets })
    // this.store.dispatch({ type: SEARCH, payload : null});
    return true
  }

  private runFilter() {
    this.selectedFilters = [];
    this.selectedFiltersX = [];
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

    this.aggregations = _.cloneDeep(this.dataFromFacet);
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
          this.negationStatus[bucket.key] = {'aggsName': this.filterDataBasic[item]['id'], 'status': 'include'}
          this.collectX[item] = true;
        }
        if (this.collectControlX.controls[item].value !== null && this.collectControlX.controls[item].value.length > 0 && this.collectControlX.controls[item].value.includes(bucket.key)) {
          bucket.selected = true;
          this.selectedFiltersX.push({'aggsName' : this.filterDataBasic[item]['id'], 'key': bucket.key, 'filterID': 'basic', 'color': 'lightblue'})
          this.negationStatus[bucket.key] = {'aggsName': this.filterDataBasic[item]['id'], 'status': 'exclude'}
          this.collectX[item] = true;
        }
      }
    }
    this.updateFilters();
  }

  private getTypeForAgg(aggregationKey : string, agg : any) {
    if(aggregationKey == "corpus_id") {return "multicomplete"}
    if(aggregationKey == "mode_id") {return "multicomplete"}
    if(aggregationKey == "word_count") {return "multicomplete"}
    if(aggregationKey == "geo_location") {return "multicomplete"}
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
  }

  public sortName(aggsName) {
    for (let item = 0; item < this.filterDataBasic.length; item++) {
      if (this.filterDataBasic[item]['id'] === aggsName) {
        if (this.filterDataBasic[item]['sortChar'] === 'desc') {
          this.filterDataBasic[item]['data'] = _.orderBy(this.filterDataBasic[item]['data'], 'key', [this.filterDataBasic[item]['sortChar']]);
          this.filterDataBasic[item]['sortChar'] = 'asc'
        } else if (this.filterDataBasic[item]['sortChar'] === 'asc'){
          this.filterDataBasic[item]['data'] = _.orderBy(this.filterDataBasic[item]['data'], 'key', [this.filterDataBasic[item]['sortChar']]);
          this.filterDataBasic[item]['sortChar'] = 'desc'
        }
        
      }
    }
  }

  public sortCount(aggsName) {
    for (let item = 0; item < this.filterDataBasic.length; item++) {
      if (this.filterDataBasic[item]['id'] === aggsName) {
        if (this.filterDataBasic[item]['sortNumber'] === 'desc') {
          this.filterDataBasic[item]['data'] = _.orderBy(this.filterDataBasic[item]['data'], 'doc_count', [this.filterDataBasic[item]['sortNumber']]);
          this.filterDataBasic[item]['sortNumber'] = 'asc'
        } else if (this.filterDataBasic[item]['sortNumber'] === 'asc'){
          this.filterDataBasic[item]['data'] = _.orderBy(this.filterDataBasic[item]['data'], 'doc_count', [this.filterDataBasic[item]['sortNumber']]);
          this.filterDataBasic[item]['sortNumber'] = 'desc'
        }
      }
    }
  }

  public switchFilter(aggsName, key, switchID) {
    if (switchID === 1 && this.negationStatus['aggsName'] === aggsName && this.negationStatus['status'] === 'include') {
      for (let item = 0; item < this.filterDataBasic.length; item++) {
        if (this.filterDataBasic[item]['id'] === aggsName) {
          const alterArray = this.collectControl.controls[item].value.filter((option) => {
            return option != key;
          });
          this.collectControl.controls[item].setValue(alterArray);
        }
      }
    }
    if (switchID === 0 && this.negationStatus['aggsName'] === aggsName && this.negationStatus['status'] === 'exclude') {
      for (let item = 0; item < this.filterDataBasic.length; item++) {
        if (this.filterDataBasic[item]['id'] === aggsName) {
          const alterArray = this.collectControlX.controls[item].value.filter((option) => {
            return option != key;
          });
          this.collectControlX.controls[item].setValue(alterArray);
        }
      }
    } 
    
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
    this.negationStatus = _.omit(this.negationStatus, key)
    this.selectChange("jumptoRunFilter", "include", aggsName, key);
  }
  public removeFilterX(aggsName, key, filterID) {
    if (filterID === 'basic') {
      for (let item = 0; item < this.filterDataBasic.length; item++) {
        if (this.filterDataBasic[item]['id'] === aggsName) {
          const alterArray = this.collectControlX.controls[item].value.filter((option) => {
            return option != key;
          });
          this.collectControlX.controls[item].setValue(alterArray);
        }
      }
    }
    this.negationStatus = _.omit(this.negationStatus, key)
    this.selectChange("jumptoRunFilter", "exclude", aggsName, key);
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
    if (this.selectedFiltersX.length > 0) {
      this.showFiltersX = true;
    } else {
      this.showFiltersX = false;
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
    let tempBuckets = [];
    for (let item of selectedBuckets) {
      if (item.field !== "corpus_id" && _.keys(this.negationStatus).includes(item.value)) {
        if (this.negationStatus[item.value]['status'] === 'include') {
          tempBuckets.push({'field': item.field, 'value': item.value+'-0'})
        } else if (this.negationStatus[item.value]['status'] === 'exclude') {
          tempBuckets.push({'field': item.field, 'value': item.value+'-1'})
        }
      } else {
        tempBuckets.push({'field': item.field, 'value': item.value})
      }
    }
    selectedBuckets = tempBuckets;
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
    if (_.keys(this.basicFacets).includes(key)) {
      this.basicFacets[key] = true;
      setTimeout(() => {
        this.addCollectControl(key, 'basic');
      }, 2000);
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
    // console.log("Step 2", this.dataFromFacet)
    setTimeout(() => {
      for (let item in this.aggregations) {
        if (item === key && getString === 'basic') {
          // console.log("Step 3", this.dataFromFacet)
          this.filterDataBasic.push({'id':key, 'data': this.dataFromFacet[item]['buckets'], 'sortChar' : 'desc', 'sortNumber' : 'desc'});
          this.collectControl.push( new FormControl());
          this.collectControlX.push( new FormControl());
          this.filterDataBasicX.push({'id':key, 'data': this.dataFromFacet[item]['buckets'], 'sortChar' : 'desc', 'sortNumber' : 'desc'})
        }
        if (item === key && getString === 'advance') {
          this.filterDataAdvance.push({'id':key, 'data': this.dataFromFacet[item]});
          // this.collectControlX.push( new FormControl());
        }
        this.loadFilter = false;
      }
    }, 200);
  }

  private removeFacet(key : string) {
    if (_.keys(this.basicFacets).includes(key)) {
      this.basicFacets[key] = false;
      this.basicFacets = _.omit(this.basicFacets, [key])
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
          this.collectControlX.removeAt(i)
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
    // this.store.dispatch({ type: SEARCH, payload : null});
  }

  public defaultFacetsNew() {
    this.store.dispatch( { type :  CHANGE_INCLUDE_FACET, payload : ['corpus_id'] })
  }

  private defaultFacets() {
    for (let i in this.filterDataBasic) {
      if (this.holdFacets.includes(this.filterDataBasic[i].id)) {
        this.filterDataBasic[i].data = this.dataFromFacet[this.filterDataBasic[i].id].buckets.filter(item => item.doc_count !== 0)
      }
    }
    // this.holdFacets = [];
    this.loadFilter = false;
  }

  private deselectFacets() {
    for (let item of _.keys(this.basicFacets)) {
      this.selectedOptions = this.selectedOptions.filter(itemX => itemX != item)
      this.removeFacet(item)
      }
  }

  // Not in use
  private selectSearch(event) {
    this.basicFilter = false;
    this.advanceFilter = false;
    this.selectedOptions = [];
    if (event === "basicFilter") {
      this.basicFilter = true;
      this.selectedTab = "basicFilter";
      if (!_.some(this.basicFacets)) {
        for (let key of this.aggregationKeys) {
          if (['year'].includes(key)) {
            this.basicFacets[key] = false;
            this.selectedOptions.push(key);
            if (this.updataFacet(key)) {
              this.chooseFacet(key)
            } 
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
        // this.updatedData();
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
