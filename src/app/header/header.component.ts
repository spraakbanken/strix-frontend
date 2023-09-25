import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs';
import { DocumentsService } from '../documents.service';
import { MetadataService } from '../metadata.service';
import { LangPhrase } from '../loc.model';
import { filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState, SEARCHINDOCUMENT, SearchRedux, OPENDOCUMENT, CLOSEDOCUMENT, MODE_SELECTED } from '../searchreducer';

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
  public yearInfo: string;
  public newspaper: string;
  public mostCommonWords: string[];
  public openDocument = false;
  public corpusID: string;

  public asyncSelected: string = "";
  private searchRedux: Observable<SearchRedux>;

  constructor(private documentsService: DocumentsService, private metadataService: MetadataService, private store: Store<AppState>) {

    this.searchRedux = this.store.select('searchRedux');

    this.subscription = documentsService.loadedDocument$.subscribe(message => {
      let openedDocument = documentsService.getDocument(message.documentIndex);
      // console.log("openedDocument", openedDocument)
      this.documentTitle = openedDocument.title;
      this.corpusName = metadataService.getName(openedDocument.corpusID);
      this.corpusID = openedDocument.corpusID;
      this.wordCount = openedDocument.word_count;
      this.yearInfo = openedDocument.textAttributes.year;
      if (openedDocument.corpusID === "jubileumsarkivet-pilot") {
        this.newspaper = openedDocument.textAttributes.newspaper;
      }
      this.mostCommonWords = openedDocument.mostCommonWords.split(', ').slice(0,10);
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === OPENDOCUMENT)).subscribe((data) => {
      // console.log("|openDocument");
      this.openDocument = true;      
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CLOSEDOCUMENT)).subscribe((data) => {
      // console.log("|closeDocument");
      this.openDocument = false;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === MODE_SELECTED)).subscribe((data) => {
      // console.log("|closeDocument");
      if (this.openDocument) {
        this.openDocument = false;
        this.closeDocument();
      }
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
