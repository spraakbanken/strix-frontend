import { Component, OnInit } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { LocService } from '../loc.service';
import { CHANGECORPORA, CHANGELANG, INITIATE, OPENDOCUMENT, CLOSEDOCUMENT } from '../searchreducer';

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

  private availableCorpora: { [key: string] : StrixCorpusConfig} = {};
  private availableCorporaKeys: string[] = [];
  private selectedCorpusID: string = "vivill"; // TODO: Temporary
  private metadataSubscription: Subscription;

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
          console.log("availableCorpora", this.availableCorpora);
        } else {
          this.availableCorpora = {}; // TODO: Show some error message
          this.availableCorporaKeys = [];
        }
    });

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.filter((d) => d.latestAction === CHANGELANG || d.latestAction === INITIATE).subscribe((data) => {
      this.selectedLanguage = data.lang;
    });

    this.searchRedux.filter((d) => d.latestAction === OPENDOCUMENT).subscribe((data) => {
      this.openDocument = true;
    });

    this.searchRedux.filter((d) => d.latestAction === CLOSEDOCUMENT).subscribe((data) => {
      this.openDocument = false;
    });

  }

  private chooseCorpus(corpusID: string) {
    this.selectedCorpusID = corpusID;
    //this.queryService.chooseCorpora([this.selectedCorpusID]);
    //this.queryService.registerUpdate();

    this.store.dispatch({ type: CHANGECORPORA, payload : [corpusID]});
  }

  private changeLanguageTo(language: string) {
    this.store.dispatch({ type: CHANGELANG, payload : language});
    //this.locService.setCurrentLanguage(language);
  }

  ngOnInit() {
  }

}
