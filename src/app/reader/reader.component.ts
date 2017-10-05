import { Component, AfterViewInit, ViewChildren, QueryList, HostListener } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/debounceTime';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';

import { StrixDocument } from '../strixdocument.model';
import { StrixSelection } from '../strixselection.model';
import { StrixEvent } from '../strix-event.enum';
import { DocumentsService } from '../documents.service';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { CmComponent } from './cm/cm.component';
import { CLOSEDOCUMENT } from '../searchreducer';
import { ReaderCommunicationService } from '../reader-communication.service';

interface AppState {
  searchRedux: any;
}


@Component({
  selector: 'reader',
  templateUrl: './reader.component.html',
  styleUrls: ['./reader.component.css']
})
export class ReaderComponent implements AfterViewInit {
  @ViewChildren(CmComponent) mirrors: QueryList<CmComponent>;
  subscription : Subscription;

  private docLoadStatusSubscription: Subscription;
  private isLoading = false;
  private openness = {'HITS' : false, 'TEXTATTRIBUTES' : true, 'STRUCTURALATTRIBUTES' : false, 'TOKENATTRIBUTES' : false};

  private mainDocument: StrixDocument;

  /* Metadata */
  private gotMetadata = false;
  private metadataSubscription: Subscription;
  private availableCorpora: { [key: string] : StrixCorpusConfig} = {};
  //private availableCorporaKeys: string[] = [];

  // Each item in cmViews is an index number of the DocumentsService documents.
  // They need not be in order!!
  private cmViews = [];

  private titles = [""];
  private selectedMirrorIndex = 0;

  private selection : StrixSelection = null;
  private selectionStartTokenID = null;
  private selectionEndTokenID = null;
  private currentAnnotations = {};
  private currentAnnotationsKeys = [];

  private showBox: boolean = false;
  private singleWordSelection: boolean = false;

  private showSidebar = true;
  private bookmarks: any = [];

  private searchRedux: Observable<any>;

  private viewPortEvent = new Subject<any>();
  private viewPortChange$: Observable<any> = this.viewPortEvent.asObservable();

  constructor(private documentsService: DocumentsService,
              private store: Store<AppState>,
              private metadataService: MetadataService,
              private readerCommunicationService: ReaderCommunicationService) {

    // When done we need to do:
    this.documentsService.tokenInfoDone$.subscribe((actuallyDidSomething) => {
      console.log("got new token data – causing refresh of the CM syntax coloring: ", actuallyDidSomething)
      if (actuallyDidSomething) this.mirrors.first.codeMirrorInstance.setOption("mode", "strix");
    });

    // Make sure the metadata is loaded
    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.availableCorpora = metadataService.getAvailableCorpora();
          console.log("the metadata", this.availableCorpora);
          this.gotMetadata = true;
        } else {
          this.availableCorpora = {}; // TODO: Show some error message
        }
    });

    // If the user closes the main document:
    this.searchRedux = this.store.select('searchRedux');
    this.searchRedux.filter((d) => d.latestAction === CLOSEDOCUMENT).subscribe((data) => {
      this.showBox = false;
      this.singleWordSelection = false;
      this.removeView(0);
    });

    // When the user changes the viewport, we wait until there is
    // a period of "radio silence" before we act on only THE LAST change.
    // This is to spare calls to the backend.
    this.viewPortChange$.debounceTime(100).subscribe( (event) =>
      this.handleViewportChange(event)
    );

    // When a document starts loading and when it is fully loaded:
    this.docLoadStatusSubscription = documentsService.docLoadingStatus$.subscribe(
      answer => {
        console.log("load status:", answer);
        switch (answer) {
          case StrixEvent.DOCLOADSTART:
            this.isLoading = true;
            break;
          case StrixEvent.DOCLOADEND:
            this.isLoading = false;
            break;
        }
      },
      error => null//this.errorMessage = <any>error
    );

    this.subscription = documentsService.loadedDocument$.subscribe(
      message => {
        console.log("A document has been fetched.", message);

        let openedDocument = documentsService.getDocument(message.documentIndex);
        this.mainDocument = openedDocument;

        console.log("the document", this.mainDocument);

        let wholeText = openedDocument.dump.join("\n");

        if (message.openInNew || this.cmViews.length === 0) {
          this.addView(message.documentIndex);
          window.setTimeout(() => { // Triggers change detection so we'll get a new mirror in the DOM.
            this.mirrors.last.codeMirrorInstance.setValue(wholeText);

            // Show the highlights
            console.log("highlight data", openedDocument);
            for (let h of openedDocument.highlight) {
              let tokenID = h.position;
              this.addHighlight(message.documentIndex, tokenID);
            }
            
          }, 0);
        } else {
          this.clearBookmarks();
          this.cmViews[0] = openedDocument.index;
          this.mirrors.first.codeMirrorInstance.setValue(wholeText);

          // Show the highlights // TODO: Get rid of code doubling (use setTimeout for both cases probably anyway)
          console.log("highlight data", openedDocument);
          for (let h of openedDocument.highlight) {
            let tokenID = h.position;
            this.addHighlight(message.documentIndex, tokenID);
          }
        }

        // Probably we haven't yet created a new mirror...so maybe
        // we'll need to trigger a digest cycle here somehow.

        //let mirrorsArray = this.mirrors.toArray();
        //mirrorsArray[cmIndex].codeMirrorInstance.setValue(wholeText);
        

        this.updateTitles();
    });

  }
  ngAfterViewInit() {
    this.readerCommunicationService.event$.subscribe((data) => {
      console.log("message from the reader communication service", data);
      const message = data["message"];
      const payload = data["payload"];
      if (message === "goToNextAnnotation" ||
          message === "goToPreviousAnnotation" ||
          message === "changeAnnotationHighlight") {
        const annotation = payload["annotation"];
        const annotationValue = payload["annotationValue"];
        const annotationStructuralType = payload["annotationStructuralType"];
        console.log("payload structure", annotationStructuralType);
        //const datatype = payload["datatype"];
        const datatype = _.isArray(this.currentAnnotations[annotation]) ? "set" : "default";
        this.changeAnnotationHighlight(annotation, annotationStructuralType, annotationValue, datatype);
        if (message === "goToNextAnnotation") {
          this.gotoAnnotation(annotation, annotationStructuralType, annotationValue, false); // TODO: Fix for structurals
        } else if (message === "goToPreviousAnnotation") {
          this.gotoAnnotation(annotation, annotationStructuralType, annotationValue, true); // TODO: Fix for structurals
        }
      }
    });
  }

  private updateTitles() {
    let newTitles = [];
    for (let index = 0; index < this.cmViews.length; index++) {
      let documentIndex = this.cmViews[index];
      if (documentIndex !== -1) {
        newTitles.push(this.documentsService.getDocument(documentIndex).title);
      }
    }
    this.titles = newTitles;
  }

  private onFocus(index: number) {
    console.log("focused mirror no", index);
    this.selectedMirrorIndex = index;
  }

  private onSelectionChange(selection : StrixSelection) {
    this.showBox = true;
    console.log("line " + selection.startRow + "(char " + selection.startChar + ") to " + selection.endRow + " (char " + selection.endChar + ")" );
    this.selection = selection;
    let activeDocument : StrixDocument = this.documentsService.getDocument(this.cmViews[this.selectedMirrorIndex]);
    console.log("activeDocument", activeDocument);
    if (activeDocument) {
      this.selectionStartTokenID = activeDocument.getTokenID(selection.startRow, selection.startChar);
      this.selectionEndTokenID = activeDocument.getTokenID(selection.endRow, selection.endChar);

      console.log("selection from tokens", this.selectionStartTokenID, this.selectionEndTokenID);
      if (this.selectionStartTokenID === -1 || this.selectionEndTokenID === -1) { // TODO: THIS WILL HAVE TO BE THOUGHT OVER!
        console.log("got -1");
        return;
      }

      if (this.selectionStartTokenID === this.selectionEndTokenID) {
        let currentToken = activeDocument.token_lookup[this.selectionStartTokenID];
        this.currentAnnotations = currentToken.attrs;
        this.currentAnnotationsKeys = Object.keys(this.currentAnnotations);
        console.log("currentAnnotations", this.currentAnnotations);
      }

      this.singleWordSelection = (this.selectionStartTokenID === this.selectionEndTokenID);
      if (this.singleWordSelection) {
        this.openness["TOKENATTRIBUTES"] = true;
      }
    }

  }
  /* Selects <tokenID> in the currently selected codemirror */
  private selectToken(cmIndex: number, tokenID) {

    let selectedDocumentIndex = this.cmViews[this.selectedMirrorIndex];
    let doc = this.documentsService.getDocument(selectedDocumentIndex);
    let result = doc.getTokenBounds(tokenID);
    console.log("result", result);

    let mirrorsArray = this.mirrors.toArray();
    mirrorsArray[cmIndex].codeMirrorInstance.setSelection(result.anchor, result.head - 1, {"scroll" : true}) // Really don't know why we need -1 (!)
  }

  private onScrollInDocument(event) {}

  private onViewportChange(event) {
    this.viewPortEvent.next(event);
  }

  private handleViewportChange(event) {
    // First check if we have token information for the current viewport already
    this.documentsService.extendTokenInfoIfNecessary(event.index || 0, event.from, event.to); // Returns observable
  }

  private onKeydown(event: any): void {
    console.log("event", event);
    if (event.event.which === 37) {
      // Left
      // TODO: Fix this ugly code. Don't use the global object here.
      this.gotoLeft(window['CodeMirrorStrixControl'][event.index].currentAnnotationType, window['CodeMirrorStrixControl'][event.index].currentAnnotationStructuralType, window['CodeMirrorStrixControl'][event.index].currentAnnotationValue );
    } else if (event.event.which === 39) {
      // Right
      this.gotoRight(window['CodeMirrorStrixControl'][event.index].currentAnnotationType, window['CodeMirrorStrixControl'][event.index].currentAnnotationStructuralType, window['CodeMirrorStrixControl'][event.index].currentAnnotationValue );
    }
  }

  private addView(documentIndex): void {
    this.cmViews.push(documentIndex); // -1 = no loaded document yet
  }

  private removeView(index: number) {
    this.cmViews.splice(index);
    window['CodeMirrorStrixControl'].splice(index);
  }

  private changeAnnotationHighlight(type: string, structuralType : string, value: string, datatype: string = "default"): void {
    console.log("changing annotation highlight for the document:", this.cmViews[this.selectedMirrorIndex]);
    let selectedDocumentIndex = this.cmViews[this.selectedMirrorIndex];
    console.log("highlighting", type, value);
    window['CodeMirrorStrixControl'][selectedDocumentIndex].currentAnnotationType = type;
    window['CodeMirrorStrixControl'][selectedDocumentIndex].currentAnnotationStructuralType = structuralType;
    window['CodeMirrorStrixControl'][selectedDocumentIndex].currentAnnotationDatatype = datatype;
    window['CodeMirrorStrixControl'][selectedDocumentIndex].currentAnnotationValue = value;

    let mirrorsArray = this.mirrors.toArray();
    for (let index = 0; index < this.cmViews.length; index++) {
      if (this.cmViews[index] === selectedDocumentIndex) {
        mirrorsArray[index].codeMirrorInstance.setOption("mode", "strix"); // Refresh highlighting
        mirrorsArray[index].codeMirrorInstance.focus(); // So the user can use the arrow keys right away

        console.log("refreshing highlight on view " + index, this.cmViews);
      }
    }
  }

  private closeBox() {
    this.showBox = false;
  }
  private gotoLeft(annotationKey: string, annotationStructuralType: string, annotationValue: string) {
    // Search for the closest previous token with the same annotation
    this.gotoAnnotation(annotationKey, annotationStructuralType, annotationValue, true);
  }
  private gotoRight(annotationKey: string, annotationStructuralType: string, annotationValue: string) {
    // Search for the closest next token with the same annotation
    this.gotoAnnotation(annotationKey, annotationStructuralType, annotationValue, false);
  }
  private gotoAnnotation(annotationKey: string, annotationStructuralType: string, annotationValue: string, backwards: boolean) {
    console.log("goto annotation", annotationKey, annotationStructuralType, annotationValue);
    let cmIndex = this.selectedMirrorIndex; // In case the user switches codemirror, we still use the correct one!
    let selectedDocumentIndex = this.cmViews[this.selectedMirrorIndex];
    if (annotationStructuralType && annotationStructuralType !== "token") {
      annotationKey = `${annotationStructuralType}.${annotationKey}`;
    }
    this.documentsService.searchForAnnotation(selectedDocumentIndex, annotationKey, annotationValue, this.selectionStartTokenID, backwards).subscribe(
      answer => {
        console.log("call success. the wid is", answer);
        this.selectToken(cmIndex, answer);
      });
  }

  private clearBookmarks() {
    this.bookmarks = [];
  }

  private addBookmark(index: number) {
    let mirrorsArray = this.mirrors.toArray();
    let cmInstance = mirrorsArray[index].codeMirrorInstance;

    let fromCursor = cmInstance.getCursor("from");
    let toCursor = cmInstance.getCursor("to");

    let selectedDocumentIndex = this.cmViews[this.selectedMirrorIndex];
    let doc = this.documentsService.getDocument(selectedDocumentIndex);

    let tokenID = doc.getTokenID(fromCursor.line, fromCursor.ch);
    let fragments: string[] = [];
    for (let t = tokenID; t < tokenID + 4; t++) {
      fragments.push(doc.token_lookup[t].word);
    }
    let text = fragments.join(" ");

    
    cmInstance.markText(fromCursor, toCursor, {"css" : "text-decoration: underline"});
    this.bookmarks.push({
      "from" : fromCursor,
      "to" : toCursor,
      "type" : "user",
      "style" : "underline",
      "text" : text
    });
  }

  private gotoBookmark(index: number, bookmark: any) {
    let mirrorsArray = this.mirrors.toArray();
    let cmInstance = mirrorsArray[index].codeMirrorInstance;
    cmInstance.setSelection(bookmark.from);
  }

  /* Highlights is a special case of bookmarks */
  private addHighlight(index: number, tokenID: number) {
    let doc = this.documentsService.getDocument(index);
    if (doc.token_lookup[tokenID]) {
      let mirrorsArray = this.mirrors.toArray();
      let cmInstance = mirrorsArray[index].codeMirrorInstance;

      let fragments: string[] = [];
      for (let t = tokenID; t < tokenID + 4; t++) {
        if (doc.token_lookup[t]) {
          fragments.push(doc.token_lookup[t].word);
        }
      }
      let text = fragments.join(" ");

      let tokenBounds = doc.getTokenBounds(tokenID);
      let fromCursor = tokenBounds.anchor;
      let toCursor = tokenBounds.head;
      //let toCursor = tokenBounds.anchor;
      //let fromCursor = tokenBounds.head;
      //toCursor.char += 1;// not sure why +1

      console.log("addHighlight", fromCursor, toCursor);

      cmInstance.markText(fromCursor, toCursor, {"css" : "background-color: #d9edf7"});
      this.bookmarks.push({
        "from" : fromCursor,
        "to" : toCursor,
        "type" : "highlight",
        "style" : "bgcolor",
        "text" : text
      });
    }
  }

  private resizeReader() {
    console.log("should now resize the reader area.");
  }

  private closeDocument() {
    console.log("should close the document now.");
  }

  /* @HostListener('window:resize', ['$event.target']) 
  onResize() { 
    console.log("ON THE RISE");
    if (this.mirrors.first) {
      //this.mirrors.first.codeMirrorInstance.setSize(null, "100%");
    }
  } */

  private _onResize(event) {
    console.log("$event", event);
    const elem = document.getElementsByClassName("readerArea")[0];
  }

}
