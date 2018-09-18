import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { DocumentsService } from '../documents.service';
import { OPENDOCUMENT, AppState } from '../searchreducer';
import { StrixDocument } from '../strixdocument.model';
import { StrixEvent } from '../strix-event.enum';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'minidocselection',
  templateUrl: './minidocselection.component.html',
  styleUrls: ['./minidocselection.component.css']
})
export class MinidocselectionComponent implements OnInit, OnDestroy {

  private subscription: Subscription;

  public documentsWithHits: StrixDocument[] = [];
  public isMainDocumentLoaded = false;

  constructor(private queryService: QueryService,
              private store: Store<AppState>,
              private documentsService: DocumentsService) {

    // Reset when a new document is being opened.
    this.documentsService.docLoadingStatus$.subscribe(event => {
      if (event === StrixEvent.DOCLOADSTART) {
        this.documentsWithHits = [];
        // Hide until main document is loaded.
        this.isMainDocumentLoaded = false;
      }
    });

    // Appear when a new document is being opened. Start fetching related documents.
    // TODO: Don't wait with this until main document has *finished* loading.
    // TODO: Don't do this on local search.
    this.subscription = documentsService.loadedDocument$
      .pipe(filter(() => !this.isMainDocumentLoaded))
      .subscribe(message => {
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
