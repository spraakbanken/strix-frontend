import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs';
import { DocumentsService } from '../documents.service';
import { MetadataService } from '../metadata.service';
import { LangPhrase } from '../loc.model';
import { filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState, SEARCHINDOCUMENT, SearchRedux, OPENDOCUMENT, CLOSEDOCUMENT, MODE_SELECTED, OPENDOCUMENT_NOHISTORY } from '../searchreducer';
import * as _ from 'lodash';

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
  public mostCommonNames: string[];
  public openDocument = false;
  public corpusID: string;
  public documentTempData = {};
  public sourceUrl: string;

  public asyncSelected: string = "";
  private searchRedux: Observable<SearchRedux>;

  constructor(private documentsService: DocumentsService, private metadataService: MetadataService, private store: Store<AppState>) {

    this.searchRedux = this.store.select('searchRedux');

    this.subscription = documentsService.loadedDocument$.subscribe(message => {
      this.documentTempData = {};
      let openedDocument = documentsService.getDocument(message.documentIndex);
      this.documentTempData = openedDocument;
      this.documentTitle = openedDocument.title;
      this.corpusName = metadataService.getName(openedDocument.corpusID);
      this.corpusID = openedDocument.corpusID;
      this.wordCount = openedDocument.word_count;
      this.yearInfo = openedDocument.textAttributes.year;
      if (openedDocument.corpusID === "jubileumsarkivet-pilot") {
        this.newspaper = openedDocument.textAttributes.newspaper;
      }
      if (openedDocument.corpusID === "detektiva") {
        this.sourceUrl = openedDocument.textAttributes.url;
      }
      this.mostCommonWords = openedDocument.mostCommonWords.split(', ').slice(0,10);
      this.mostCommonNames = openedDocument.mostCommonNames.split(', ').slice(0,5);
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === OPENDOCUMENT)).subscribe((data) => {
      if (_.keys(this.documentTempData).length > 0 && data.history === false) {
        this.documentTitle = this.documentTempData['title'];
        this.corpusName = metadataService.getName(this.documentTempData['corpusID'])
        this.corpusID = this.documentTempData['corpusID'];
        this.wordCount = this.documentTempData['word_count'];
        this.yearInfo = this.documentTempData['textAttributes']['year'];
        if (this.documentTempData['corpusID'] === "jubileumsarkivet-pilot") {
          this.newspaper = this.documentTempData['textAttributes']['newspaper'];
        }
        if (this.documentTempData['corpusID'] === "riksarkivet") {
          this.sourceUrl = this.documentTempData['textAttributes']['url'];
        }
        this.mostCommonWords = this.documentTempData['mostCommonWords'].split(', ').slice(0,10);
        this.mostCommonNames = this.documentTempData['mostCommonNames'].split(', ').slice(0,5);
      }
      this.openDocument = true;      
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CLOSEDOCUMENT)).subscribe((data) => {
      // console.log("|closeDocument");
      this.openDocument = false;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === MODE_SELECTED)).subscribe((data) => {
      if (this.openDocument && data.modeStatus === "continue") {
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

  public simpleSearchName(item) {
    let xItem = item.split(' (').splice(0,1)[0]
    this.store.dispatch({ type: SEARCHINDOCUMENT, payload : _.toLower(xItem)});
  }

}
