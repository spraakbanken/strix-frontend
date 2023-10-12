import { Component, OnInit } from '@angular/core';
import { Subscription, Observable, zip } from 'rxjs';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { AppState, MODE_SELECTED, INITIATE, OPENDOCUMENT_NOHISTORY, CLOSEDOCUMENT_NOHISTORY } from '../searchreducer';
import { RoutingService } from 'app/routing.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'modeselection',
  templateUrl: './modeselection.component.html',
  styleUrls: ['./modeselection.component.css']
})

export class ModeselectionComponent implements OnInit {

  public modeCollection = {};
  public modeSelection = {};
  public listMode = {};
  public visibleMode = '';
  public minkMode = false;
  public documentParam = {};
  public filterData = {};

  private modeItem : { mode : string[], corpuses : string[], preSelect: string[], modeStatus: string };
  public addFacet = [];

  public addCorpuses = [];

  public preSelectCorpora = [];

  private metadataSubscription: Subscription;

  private searchRedux: Observable<any>;

  private availableCorpora : { [key: string] : StrixCorpusConfig};

  
  constructor(private metadataService: MetadataService,
              private store: Store<AppState>,
              private routingService: RoutingService,
              ) {

    // if (window["jwt"]) {
    //   console.log("Login success");
    // } else {
    //   console.log("Login failed");
    // }

    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.availableCorpora = this.metadataService.getAvailableCorpora();
          // console.log("this.availableCorpora subsc", this.availableCorpora)
        }
    });

    this.searchRedux = this.store.select('searchRedux');
  }
  

  private collectMode() {
    this.modeCollection = {};
    this.modeSelection = {};
    if (window["jwt"]) {
      for (let key in this.availableCorpora) {
        if (this.availableCorpora[key]['modeID'] === 'mink') {
          this.minkMode = true;
        }
        if (this.availableCorpora[key]['modeID'] in this.modeCollection) {
          this.modeCollection[this.availableCorpora[key]['modeID']].push(this.availableCorpora[key]['corpusID'])
        } else {
          this.modeCollection[this.availableCorpora[key]['modeID']] = []
          this.modeCollection[this.availableCorpora[key]['modeID']].push(this.availableCorpora[key]['corpusID'])
          this.modeSelection[this.availableCorpora[key]['modeID']] = false
          this.listMode[this.availableCorpora[key]['modeID']] = this.availableCorpora[key]['mode']
        }
      }
    } else {
      this.minkMode = false;
      for (let key in this.availableCorpora) {
        if (!this.availableCorpora[key]['protectedX']) {
          if (this.availableCorpora[key]['modeID'] in this.modeCollection) {
            this.modeCollection[this.availableCorpora[key]['modeID']].push(this.availableCorpora[key]['corpusID'])
          } else {
            this.modeCollection[this.availableCorpora[key]['modeID']] = []
            this.modeCollection[this.availableCorpora[key]['modeID']].push(this.availableCorpora[key]['corpusID'])
            this.modeSelection[this.availableCorpora[key]['modeID']] = false
            this.listMode[this.availableCorpora[key]['modeID']] = this.availableCorpora[key]['mode']
          }
        }    
      }
    }
  }

  public chooseMode(modeKey: string, status: string) {
    this.modeItem = { mode : [], corpuses : [], preSelect : this.preSelectCorpora, modeStatus: status };
    for (let item in this.modeSelection) {
      if (item === modeKey) {
        this.modeSelection[item] = true;
        this.modeItem.mode.push(item.toLowerCase());
        this.modeItem.corpuses.push(this.modeCollection[item]);
        if (item === 'default' || item === 'mink') {
          this.visibleMode = '';
        } else {
          this.visibleMode = item;
        }
      } else {
        this.modeSelection[item] = false
      }
    }
    this.updateFilters(status);
  }

  private updateFilters(status) {
    this.store.dispatch({ type: MODE_SELECTED, payload : this.modeItem});
    if (status === 'continue') {
      this.documentParam = {}
    }
    if (_.keys(this.documentParam).length > 0) {
    setTimeout(() => {
      if (this.documentParam['documentID'] && this.documentParam['documentCorpus']) {
        this.store.dispatch({
          type : OPENDOCUMENT_NOHISTORY,
          payload : {
            doc_id : this.documentParam["documentID"],
            corpus_id : this.documentParam["documentCorpus"]
          }
        });
      } else {
        this.store.dispatch({
          type : CLOSEDOCUMENT_NOHISTORY,
        });
      }
    }, 3000);
    }
  }

  ngOnInit() {
    zip(
    this.metadataService.loadedMetadata$, 
    this.searchRedux.pipe(filter((d) => d.latestAction === INITIATE))).subscribe(([info, data]: [any, any]) => {
      this.collectMode();
      let tempURL = this.routingService.getCurrentState();
      if (tempURL.documentCorpus !== null && tempURL.documentID !== null) {
        this.documentParam['documentCorpus'] = tempURL.documentCorpus;
        this.documentParam['documentID'] = tempURL.documentID;
      }
      if (_.keys(tempURL.filters).length > 0) {
        this.filterData = tempURL.filters;
        this.preSelectCorpora = _.map(_.takeRightWhile(_.values(tempURL.filters), ['field', 'corpus_id']), 'value')
      }
      if (tempURL.modeSelected[0] === "default") {
        this.chooseMode('default', 'initial');
      } else {
        this.chooseMode(tempURL.modeSelected[0], 'initial')
      }  
    });
  }
}

