import { Component, OnInit } from '@angular/core';
import { Subscription, Observable, zip } from 'rxjs';
import { filter, skip } from 'rxjs/operators';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import {
SEARCH, CHANGEFILTERS, CHANGE_INCLUDE_FACET, MODE_SELECTED,
INITIATE, OPENDOCUMENT, CLOSEDOCUMENT, AppState, SELECTED_CORPORA, DOC_SIZE, WORD_COUNT, YEAR_RANGE, YEAR_INTERVAL, UNDEFINED_YEAR, YEAR_NA
} from '../searchreducer';
import { Bucket, Aggregations, Agg, AggregationsResult } from "../strixresult.model";
import {FormControl, FormArray} from '@angular/forms';
import { LocService } from '../loc.service';
import { CallsService } from 'app/calls.service';

@Component({
  selector: 'statcolumn',
  templateUrl: 'statcolumn.component.html',
  styleUrls: ['statcolumn.component.css']
})
export class StatcolumnComponent implements OnInit {

  public modeSelected = '';
  public corpusInMode = [];
  public selectedCorpus = [];
  public selectedFilters = [];
  public documentSize = "";
  public yearInterval = "";

  checked = false;
  indeterminate = false;
  public openDocument = false;

  public selecT = false;
  public simpleSearch = false;
  public advanceSearch = false;
  public basicFilter = false;
  public advanceFilter = false;
  public gotMetadata = false;
  public showFilters = false;
  public undefYears = false;

  public bucketsInMode = [];
  public bucketsInMode1 : Aggregations = {};
  private currentMode = 'Modern';
  private getInc = 0;

  public corpusC = new FormControl();
  public corpuses : string[] = ['a', 'b', 'c', 'd'];
  public filterList : string[] = [];

  public selectType = 'searchView';
  public selectFilter = 'simpleFilter';
  public selectedTab = 'simpleSearch';

  private metadataSubscription: Subscription;
  private aggregatedResultSubscription: Subscription;

  private aggregations : Aggregations = {};
  private aggregationKeys: string[] = [];
  private aggResult : Aggregations = {};
  
  private unusedFacets : string[] = [];
  public basicFacets = {};
  public advanceFacets = {};
  public extendedFacets = {};
  public mapFacets = {};
  private docCountAgg = {};

  private searchRedux: Observable<any>;
  public include_facets : string[] = []
  private availableCorpora : { [key: string] : StrixCorpusConfig};
  public dataFromMode = {};
 
  //private currentFilters: any[] = []; // TODO: Make some interface

  public myControl = new FormControl();
  public collectControl = new FormArray([]);
  public collectControlX = new FormArray([]);
  public filterDataBasic = [];
  public filterDataAdvance = [];
  public currentControl = {};


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

    this.searchRedux.pipe(filter((d) => d.latestAction === DOC_SIZE)).subscribe((data) => {
      this.documentSize = data.docSize;
      this.runFilter();
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === YEAR_INTERVAL)).subscribe((data) => {
      this.yearInterval = data.yearInterval;
      this.runFilter();
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === UNDEFINED_YEAR)).subscribe((data) => {
      this.undefYears = data.undefinedYear;
      this.runFilter();
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === MODE_SELECTED)).subscribe((data) => {
      for (let item of this.selectedFilters) {
        this.removeFilter(item.aggsName, item.key, item.filterID);
      }
      this.resetIncludeFacets();
      this.modeSelected = data.modeSelected[0];
      this.selectedCorpus = data.corporaInMode[0];
      // this.store.dispatch({ type: SELECTED_CORPORA, payload : this.selectedCorpus});
      this.documentSize = "";
      this.yearInterval = "";
      this.callsService.getModeStatistics(data.corporaInMode[0], data.modeSelected).subscribe((result) => {
        this.dataFromMode  = result.aggregations;
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
          this.store.dispatch({ type: YEAR_RANGE, payload: [x1, y1]})
        }
        let wordCount = this.dataFromMode['word_count'].buckets.filter(item => item.doc_count != 0)
        wordCount = _.map(wordCount, 'key').sort((a,b) => (a as any) - (b as any))
        let x = wordCount[0];
        let y = wordCount.splice(-1)[0];
        this.store.dispatch({ type: WORD_COUNT, payload: [x,y]})
        this.decorateWithParent(this.dataFromMode);
        this.updatedData();
      });
      this.selectSearch('simpleSearch');

    });

    this.searchRedux.pipe(filter((d) => d.latestAction === SELECTED_CORPORA)).subscribe((data) => {
      this.selectedCorpus = data.selectedCorpora;
      this.runFilter();
    });

    this.aggregatedResultSubscription = queryService.aggregationResult$.pipe(skip(1)).subscribe(
      (result : AggregationsResult) => {
        this.docCountAgg = result.aggregations;

        this.parseSubAggStats(result)
      },
      error => null//this.errorMessage = <any>error
    );

    /* this.searchRedux.filter((d) => d.latestAction === INITIATE).subscribe((data) => {
      // console.log("SHOULD INITIATE FILTERS WITH", data.filters);
    }); */
  }

  public changeView(event) {
    if (event === 'search') {
      this.selectType = 'searchView';
    }
    if (event === 'filter') {
      this.selectType = 'filterView';
    }
  }

  public changeFilter(event) {
      this.selectFilter = event;
  }

  public selectChange(event) {
    this.runFilter();
  }

  private runFilter() {
    this.selectedFilters = [];
    for (let agg in this.aggregations) {
      if (agg !== 'corpus_id') {
        _.forEach(this.aggregations[agg].buckets, (bucket) => {
          if (bucket !== undefined) {
          if (bucket.selected) {
            //delete bucket.selected
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
              //delete bucket.selected
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

    let excludeBucket = ['year', 'word_count', 'author', 'corpus_id', 'mode_id']
  
    if (this.currentMode === 'Modern' && this.getInc === 0) {
      this.basicFacets = {};
      this.advanceFacets = {};
      this.extendedFacets = {};
      for (let facet of this.aggregationKeys) {
        if (!excludeBucket.includes(facet)) {
          if (this.aggregations[facet].type === 'range') {
            this.extendedFacets[facet] = false;
          } else {
            this.basicFacets[facet] = false;
            // this.advanceFacets[facet] = false;
          }
        } 
      }
      this.getInc = 1;
    }
    else if (this.modeSelected === this.currentMode) {
      console.log(this.currentMode)
    } 
    else {
      this.currentMode = this.modeSelected;
      // for (let key in this.basicFacets) {
      //   if (this.basicFacets[key]) {
      //     this.removeFacet(key);
      //   }
      // }
      // for (let key in this.advanceFacets) {
      //   if (this.advanceFacets[key]) {
      //     this.removeFacet(key);
      //   }
      // }
      // for (let key in this.extendedFacets) {
      //   if (this.extendedFacets[key]) {
      //     this.removeFacet(key);
      //   }
      // }
      this.basicFacets = {};
      this.advanceFacets = {};
      this.extendedFacets = {};
      this.filterDataBasic = [];
      this.filterDataAdvance = [];
      this.collectControl.clear();
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
            if (this.availableCorpora[bucket.key]['mode']['eng'].toLowerCase() === this.modeSelected) {
              if (this.modeSelected === 'modern' && bucket.key === 'wikipedia') {
                bucket.selected = true;
              } else if (this.modeSelected === 'modern' && bucket.key !== 'wikipedia')  {
                bucket.selected = false;
              } else {
                bucket.selected = true;
              }
              // bucket.selected = true;
            } else {
              bucket.selected = false;
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
    if (this.documentSize) {
      selectedBuckets = selectedBuckets.filter(item => item.field != 'docSize')
      selectedBuckets.push({"field": "docSize", "value": this.documentSize})
    if (!this.documentSize) {
      selectedBuckets = selectedBuckets.filter(item => item.field != 'docSize')
      // selectedBuckets.push({"field": "docSize", "value": this.documentSize})
      }
    }
    if (this.undefYears) {
      selectedBuckets = selectedBuckets.filter(item => item.field != 'yearNA')
      selectedBuckets.push({"field": "yearNA", "value": '2050-2050'})
    }
    if (!this.undefYears) {
      selectedBuckets = selectedBuckets.filter(item => item.field != 'yearNA')
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
    // this.store.dispatch({ type: SEARCH, payload : null});
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
          this.filterDataBasic.push({'id':key, 'data': this.dataFromMode[item]});
          this.collectControl.push( new FormControl());
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

  private selectSearch(event) {
    this.selecT = false;
    this.simpleSearch = false;
    this.advanceSearch = false;
    this.basicFilter = false;
    this.advanceFilter = false;
    if (event === "simpleSearch") {
      this.simpleSearch = true;
      this.selectedTab = "simpleSearch";
    }
    if (event === "advanceSearch") {
      this.advanceSearch = true;
      this.selectedTab = "advanceSearch";
    }
    if (event === "basicFilter") {
      this.basicFilter = true;
      this.selectedTab = "basicFilter";
      if (!_.some(this.basicFacets)) {
        for (let item of _.keys(this.basicFacets).slice(0,4)) {
          this.chooseFacet(item);
        }
      }
    }
    if (event === "advanceFilter") {
      this.advanceFilter = true;
    }
  }

  public reloadStrix() {
    window.location.href = window.location.pathname;
  }


  ngOnInit() {
    // Filtrera på INITIATE nedan
    zip(
      this.queryService.aggregationResult$,
      this.searchRedux.pipe(filter((d) => d.latestAction === INITIATE)),
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
    this.simpleSearch = true;
  }
}
