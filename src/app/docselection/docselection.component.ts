import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';

import { QueryService } from '../query.service';
import { DocumentsService } from '../documents.service';
import { MetadataService } from '../metadata.service';
import { StrixDocument } from '../strixdocument.model';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { OPENDOCUMENT, CHANGEPAGE, RELOAD, INITIATE, CHANGEQUERY, AppState } from '../searchreducer';
import { SearchResult } from '../strixresult.model';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'docselection',
  templateUrl: './docselection.component.html',
  styleUrls: ['./docselection.component.css']
})
export class DocselectionComponent implements OnInit {

  private hasSearched = false;
  private disablePaginatorEvent = false;
  
  private currentPaginatorPage: number = 1; // Needs to be 1-based because of the paginator widget

  private documentsWithHits: StrixDocument[] = [];//StrixDocHit[] = [];
  private totalNumberOfDocuments: number = 0;

  private textAttributes: any[] = [];

  private availableCorpora: { [key: string] : StrixCorpusConfig} = {};
  private checkedCorpora: any = {};

  private show = true;

  private searchResultSubscription: Subscription;
  private metadataSubscription: Subscription;
  private gotMetadata = false;

  constructor(private documentsService: DocumentsService,
              private queryService: QueryService,
              private metadataService: MetadataService,
              private store: Store<AppState>) {

    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.availableCorpora = metadataService.getAvailableCorpora();
          this.gotMetadata = true;
        } else {
          this.availableCorpora = {}; // TODO: Show some error message
        }
    });

    this.store.select('ui').pipe(filter((d) => d.latestAction === OPENDOCUMENT)).subscribe(() => {
      console.log("OPENDOCUMENT");
      this.documentsWithHits = [];
      this.totalNumberOfDocuments = 0;
      this.hasSearched = false;
      //this.show = false;
    });
    this.store.pipe(filter((d) => d.ui.latestAction === CHANGEQUERY)).subscribe((data) => {
      this.currentPaginatorPage = data.query.page;
    })

    this.searchResultSubscription = queryService.searchResult$.subscribe(
      (answer: SearchResult) => {

        this.documentsWithHits = answer.data;
        this.totalNumberOfDocuments = answer.count;
        this.hasSearched = true;

        
      },
      error => null//this.errorMessage = <any>error
    );

  }

  ngOnInit() {
    this.store.pipe(filter((d) => d.ui.latestAction === INITIATE)).subscribe((data) => {
      console.log("init", data)
      //this.currentPaginatorPage = data.page
      this.setPaginatorPage(data.query.page)
    })
  }

  private setPaginatorPage(page) {
    // Workaround to supress the paginator event when set by the back button or similar
    // We need to check that it actually changes, else the next paginator interaction will
    // still be disabled.
    if (page !== this.currentPaginatorPage) {
      this.disablePaginatorEvent = true;
      this.currentPaginatorPage = page;
    }
  }

  private paginatorPageChanged(event: any) {
    if (! this.disablePaginatorEvent ) { // So we don't get an extra search from the back-button
      console.log("Changed paginator page", event);
      //this.queryService.setPage(event.page); // Should probably be a dispatch to the store
      this.store.dispatch({type : CHANGEPAGE, payload: event.page});
      this.store.dispatch({type : RELOAD, payload : null});
      //this.simpleSearch(true);
    } else {
      console.log("Supressed paginator event.")
      this.disablePaginatorEvent = false;
    }
  }

  private openDocument(docIndex: number) {
    let doc = this.documentsWithHits[docIndex];
    console.log("doc to open", doc);
    this.store.dispatch({type : OPENDOCUMENT, payload : doc});
  }
  private openDocumentInNew(docIndex: number) { // <- Not currently in use
    let doc = this.documentsWithHits[docIndex];
    //this.documentsService.loadDocumentWithQuery(doc.doc_id, doc.corpusID, doc.highlights, this.queryService.getSearchString(), true);
  }

  private displayCorpusInfo(docIndex: number) {
    let doc = this.documentsWithHits[docIndex];
    this.textAttributes = _.map(doc.textAttributes, (item, key) => {
      return {"key" : key, "value" : item};
    });
  }

}
