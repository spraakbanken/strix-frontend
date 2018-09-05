import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { DocumentsService } from '../documents.service';
import { OPENDOCUMENT, RELOAD, SEARCH, AppState } from '../searchreducer';
import { StrixDocument } from '../strixdocument.model';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'minidocselection',
  templateUrl: './minidocselection.component.html',
  styleUrls: ['./minidocselection.component.css']
})
export class MinidocselectionComponent implements OnInit, OnDestroy {

  private searchRedux: Observable<any>;
  private subscription: Subscription;

  public documentsWithHits: StrixDocument[] = [];
  public isMainDocumentLoaded = false;

  constructor(private queryService: QueryService,
              private store: Store<AppState>,
              private documentsService: DocumentsService) {
    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.pipe(filter((d) => [OPENDOCUMENT, SEARCH, RELOAD].includes(d.latestAction)))
      .subscribe(() => {
      this.documentsWithHits = [];
      // Hide until main document is loaded.
      this.isMainDocumentLoaded = false;
    });

    this.subscription = documentsService.loadedDocument$.subscribe(
      message => {
        this.isMainDocumentLoaded = true;
        documentsService.getRelatedDocuments(message.documentIndex).subscribe(
          answer => {
            console.log("related data", answer["data"]);
            this.documentsWithHits = answer["data"];
          }
        );
    });
  }

  public openDocument(docIndex: number) {
    let doc = this.documentsWithHits[docIndex];
    this.store.dispatch({type : OPENDOCUMENT, payload : doc});
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
