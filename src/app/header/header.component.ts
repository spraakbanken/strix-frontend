import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { DocumentsService } from '../documents.service';
import { MetadataService } from '../metadata.service';
import { LangPhrase } from '../loc.model';

import { Store } from '@ngrx/store';
import { AppState, SEARCHINDOCUMENT } from '../searchreducer';

/**
 * The header component should let the user search in the open document and as well
 * as see info about the current open document and be able to close it.
 * The component should only be visible when there is an open document.
 */

@Component({
  selector: 'header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  
  private subscription: Subscription;
  public documentTitle: string;
  public corpusName: LangPhrase;
  public wordCount: number;
  public mostCommonWords: string[];

  public asyncSelected: string = "";

  constructor(private documentsService: DocumentsService, private metadataService: MetadataService, private store: Store<AppState>) {

    this.subscription = documentsService.loadedDocument$.subscribe(message => {
      let openedDocument = documentsService.getDocument(message.documentIndex);
      console.log("openedDocument", openedDocument)
      this.documentTitle = openedDocument.title;
      this.corpusName = metadataService.getName(openedDocument.corpusID);
      this.wordCount = openedDocument.word_count;
      this.mostCommonWords = openedDocument.mostCommonWords.split(', ').slice(0,10);
    });

  }

  private closeDocument() {
    this.documentsService.closeMainDocument();
    this.documentTitle = null;
    this.corpusName = null;
  }

  ngOnInit() {
  }

  public simpleSearch(item) {
    let xItem = item.split(' ').splice(0,1)[0]
    this.store.dispatch({ type: SEARCHINDOCUMENT, payload : xItem});
  }

}
