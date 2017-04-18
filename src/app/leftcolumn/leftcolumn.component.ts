import { Component, OnInit } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { LocService } from '../loc.service';
import { SEARCH, CHANGECORPORA, CHANGELANG, CHANGEFILTERS, INITIATE, OPENDOCUMENT, CLOSEDOCUMENT } from '../searchreducer';

interface AppState {
  searchRedux: any;
}

@Component({
  selector: 'leftcolumn',
  templateUrl: './leftcolumn.component.html',
  styleUrls: ['./leftcolumn.component.css']
})
export class LeftcolumnComponent implements OnInit {

  private languages = ["swe", "eng"]; // TODO: Move to some config
  private selectedLanguage: string = "";
  private gotMetadata = false;

  private availableCorpora: { [key: string] : StrixCorpusConfig} = {};
  private availableCorporaKeys: string[] = [];
  private selectedCorpusID: string = "vivill"; // TODO: Temporary
  private metadataSubscription: Subscription;
  private searchResultSubscription: Subscription;

  private aggregations = {};
  private aggregationKeys: string[] = [];
  private currentFilters: any[] = []; // TODO: Make some interface
  /*
    field : "fieldname",
    values : ["value1", "value2"]
  */

  private openDocument = false;

  private searchRedux: Observable<any>;

  constructor(private metadataService: MetadataService,
              private queryService: QueryService,
              private store: Store<AppState>,
              private locService: LocService) {
    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.availableCorpora = metadataService.getAvailableCorpora();
          this.availableCorporaKeys = _.keys(this.availableCorpora);
          this.gotMetadata = true;
        } else {
          this.availableCorpora = {}; // TODO: Show some error message
          this.availableCorporaKeys = [];
        }
    });

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.filter((d) => d.latestAction === CHANGELANG || d.latestAction === INITIATE).subscribe((data) => {
      this.selectedLanguage = data.lang;
      this.updateFilters();
    });

    this.searchRedux.filter((d) => d.latestAction === OPENDOCUMENT).subscribe((data) => {
      this.openDocument = true;
    });

    this.searchRedux.filter((d) => d.latestAction === CLOSEDOCUMENT).subscribe((data) => {
      this.openDocument = false;
    });

    this.searchResultSubscription = queryService.searchResult$.subscribe(
      answer => {
        console.log("answer", answer);
        // Make use of the aggregations
        this.aggregations = answer.aggregations;
        this.aggregationKeys = _.keys(this.aggregations);
        //this.documentsWithHits = answer.data;
        //this.totalNumberOfDocuments = answer.count;
        //this.isLoading = false;
      },
      error => null//this.errorMessage = <any>error
    );

  }

  private chooseCorpus(corpusID: string) {
    this.selectedCorpusID = corpusID;
    //this.queryService.chooseCorpora([this.selectedCorpusID]);
    //this.queryService.registerUpdate();
    this.currentFilters = [];

    this.store.dispatch({ type: CHANGECORPORA, payload : [corpusID]});
    this.store.dispatch({ type: SEARCH, payload : null});
  }

  private chooseBucket(aggregationKey: string, bucket: string) {
    console.log(aggregationKey, bucket);

    let found = false;
    for (let currentFilter of this.currentFilters) {
      if (currentFilter.field === aggregationKey) {
        found = true;
        currentFilter.values = [bucket]; // TODO: Rather add it to the list when the backend supports multiple values for filters
      }
    }
    if (! found) {
      this.currentFilters.push({
        "field" : aggregationKey,
        "values" : [bucket]
      });
    }

    this.updateFilters();
    
  }

  private purgeFilter(aggregationKey: string) {
    for (let i = 0; i < this.currentFilters.length; i++) {
      if (this.currentFilters[i].field === aggregationKey) {
        this.currentFilters.splice(i);
        break;
      }
    }
    this.updateFilters();
  }

  private hasFilter(aggregationKey: string): boolean {
    for (let currentFilter of this.currentFilters) {
      if (currentFilter.field === aggregationKey) {
        return true;
      }
    }
    return false;
  }

  private purgeCorpus() {
    this.selectedCorpusID = null;
  }

  private changeLanguageTo(language: string) {
    this.store.dispatch({ type: CHANGELANG, payload : language});
    //this.locService.setCurrentLanguage(language);
  }

  private updateFilters() {
    this.store.dispatch({ type: CHANGEFILTERS, payload : this.currentFilters});
    this.store.dispatch({ type: SEARCH, payload : null});
  }

  ngOnInit() {
  }

}
