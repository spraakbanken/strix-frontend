import { Component, OnInit } from '@angular/core';
import { Subscription, Observable, zip } from 'rxjs';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { SEARCH, AppState, MODE_SELECTED, INITIATE } from '../searchreducer';
import { RoutingService } from 'app/routing.service';
import { filter, skip } from 'rxjs/operators';

@Component({
  selector: 'modeselection',
  templateUrl: './modeselection.component.html',
  styleUrls: ['./modeselection.component.css']
})

export class ModeselectionComponent implements OnInit {

  public modeCollection = {};
  public modeSelection = {};

  private modeItem : { mode : string[], corpuses : string[] };
  public addFacet = [];

  public addCorpuses = [];

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
        if (this.availableCorpora[key]['mode']['eng'] in this.modeCollection) {
          this.modeCollection[this.availableCorpora[key]['mode']['eng']].push(this.availableCorpora[key]['corpusID'])
        } else {
          this.modeCollection[this.availableCorpora[key]['mode']['eng']] = []
          this.modeCollection[this.availableCorpora[key]['mode']['eng']].push(this.availableCorpora[key]['corpusID'])
          this.modeSelection[this.availableCorpora[key]['mode']['eng']] = false
        }
      }
    } else {
      for (let key in this.availableCorpora) {
        if (!this.availableCorpora[key]['protectedX']) {
          if (this.availableCorpora[key]['mode']['eng'] in this.modeCollection) {
            this.modeCollection[this.availableCorpora[key]['mode']['eng']].push(this.availableCorpora[key]['corpusID'])
          } else {
            this.modeCollection[this.availableCorpora[key]['mode']['eng']] = []
            this.modeCollection[this.availableCorpora[key]['mode']['eng']].push(this.availableCorpora[key]['corpusID'])
            this.modeSelection[this.availableCorpora[key]['mode']['eng']] = false
          }
        }    
      }
  }
  }

  public chooseMode(modeKey: string) {
    this.modeItem = { mode : [], corpuses : [] };
    for (let item in this.modeSelection) {
      if (item === modeKey) {
        this.modeSelection[item] = true
        this.modeItem.mode.push(item.toLowerCase());
        this.modeItem.corpuses.push(this.modeCollection[item]);
      } else {
        this.modeSelection[item] = false
      }
    }
    this.updateFilters();
  }

  private updateFilters() {
    this.store.dispatch({ type: MODE_SELECTED, payload : this.modeItem});
    // this.store.dispatch({ type: SEARCH, payload : null});
  }

  ngOnInit() {
    zip(
    this.metadataService.loadedMetadata$, 
    this.searchRedux.pipe(filter((d) => d.latestAction === INITIATE))).subscribe(([info, data]: [any, any]) => {
      this.collectMode();
      this.chooseMode('Modern');
    });
  }
}

