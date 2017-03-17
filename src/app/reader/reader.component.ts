import { Component, AfterViewInit, ViewChildren, QueryList, HostListener } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';


import { StrixDocument } from '../strixdocument.model';
import { StrixSelection } from '../strixselection.model';
import { StrixEvent } from '../strix-event.enum';
import { DocumentsService } from '../documents.service';
import { CmComponent } from './cm/cm.component';
import { CLOSEDOCUMENT } from '../searchreducer';

interface AppState {
  searchRedux: any;
}


@Component({
  selector: 'reader',
  templateUrl: './reader.component.html',
  styleUrls: ['./reader.component.css']
})
export class ReaderComponent implements AfterViewInit {
  //@ViewChild(CmComponent) mirror: CmComponent;
  @ViewChildren(CmComponent) mirrors: QueryList<CmComponent>;
  subscription : Subscription;

  private docLoadStatusSubscription: Subscription;
  private isLoading = false;

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
  private annotationsListLeft = "inherit";
  private annotationsListTop = "inherit";
  private annotationsListRight = "inherit";
  private annotationsListBottom = "inherit";

  private showSidebar = true;
  private bookmarks: any = [];

  private searchRedux: Observable<any>;

  /*
    this.showBox = false;
    this.cmViews.splice(0);
    break;
  */


  constructor(private documentsService : DocumentsService, private store: Store<AppState>) {

    // If the user closes the main document:
    this.searchRedux = this.store.select('searchRedux');
    this.searchRedux.filter((d) => d.latestAction === CLOSEDOCUMENT).subscribe((data) => {
      this.showBox = false;
      this.singleWordSelection = false;
      //this.mirrors.first.codeMirrorInstance.setValue("");
      this.removeView(0);
      //this.cmViews.splice(0);
    });

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

      if (this.selectionStartTokenID === -1 || this.selectionEndTokenID === -1) { // TODO: THIS WILL HAVE TO BE THOUGHT OVER!
        return;
      }

      if (this.selectionStartTokenID === this.selectionEndTokenID) {
        let currentToken = activeDocument.token_lookup[this.selectionStartTokenID];
        this.currentAnnotations = currentToken.attrs;
        this.currentAnnotationsKeys = Object.keys(this.currentAnnotations);
      }

      console.log("–––", selection.realCoordinates);
      this.annotationsListLeft = selection.realCoordinates.left + "px";
      this.annotationsListTop = selection.realCoordinates.bottom + "px";

      this.singleWordSelection = (this.selectionStartTokenID === this.selectionEndTokenID);
    }

  }
  /* Selects <tokenID> in the currently selected codemirror */
  private selectToken(cmIndex: number, tokenID) {
    let anchor = {"line" : 0, "ch" : 0};
    let head = {"line" : 0, "ch" : 0};

    let selectedDocumentIndex = this.cmViews[this.selectedMirrorIndex];
    let doc = this.documentsService.getDocument(selectedDocumentIndex);
    let result = doc.getTokenBounds(tokenID);
    console.log("result", result);

    let mirrorsArray = this.mirrors.toArray();
    mirrorsArray[cmIndex].codeMirrorInstance.setSelection(result.anchor, result.head, {"scroll" : true})
  }

  private onScrollInDocument() {
    this.singleWordSelection = false;
  }

  private onKeydown(event: any): void {
    console.log("event", event);
    if (event.event.which === 37) {
      // Left
      // TODO: Fix this ugly code. Don't use the global object here.
      this.gotoLeft(window['CodeMirrorStrixControl'][event.index].currentAnnotationType, window['CodeMirrorStrixControl'][event.index].currentAnnotationValue );
    } else if (event.event.which === 39) {
      // Right
      this.gotoRight(window['CodeMirrorStrixControl'][event.index].currentAnnotationType, window['CodeMirrorStrixControl'][event.index].currentAnnotationValue );
    }
  }

  private addView(documentIndex): void {
    this.cmViews.push(documentIndex); // -1 = no loaded document yet
  }

  private removeView(index: number) {
    this.cmViews.splice(index);
    window['CodeMirrorStrixControl'].splice(index);
  }

  private changeAnnotationHighlight(type : string, value : string) : void {
    console.log("changing annotation highlight for the document:", this.cmViews[this.selectedMirrorIndex]);
    let selectedDocumentIndex = this.cmViews[this.selectedMirrorIndex];
    console.log("highlighting", type, value);
    window['CodeMirrorStrixControl'][selectedDocumentIndex].currentAnnotationType = type;
    window['CodeMirrorStrixControl'][selectedDocumentIndex].currentAnnotationValue = value;

    let mirrorsArray = this.mirrors.toArray();
    for (let index = 0; index < this.cmViews.length; index++) {
      if (this.cmViews[index] === selectedDocumentIndex) {
        mirrorsArray[index].codeMirrorInstance.setOption("mode", "strix"); // Refresh highlighting
        console.log("refreshing highlight on view " + index, this.cmViews);
      }
    }
  }

  private closeBox() {
    this.showBox = false;
  }
  private gotoLeft(annotationKey: string, annotationValue: string) {
    // Search for the closest previous token with the same annotation
    this.gotoAnnotation(annotationKey, annotationValue, true);
  }
  private gotoRight(annotationKey: string, annotationValue: string) {
    // Search for the closest next token with the same annotation
    this.gotoAnnotation(annotationKey, annotationValue, false);
  }
  private gotoAnnotation(annotationKey: string, annotationValue: string, backwards: boolean) {
    console.log("goto annotation");
    let cmIndex = this.selectedMirrorIndex; // In case the user switches codemirror, we still use the correct one!
    let selectedDocumentIndex = this.cmViews[this.selectedMirrorIndex];
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
    for( let t = tokenID; t < tokenID + 4; t++) {
      fragments.push(doc.token_lookup[t].word);
    }
    let text = fragments.join(" ");

    

    //cmInstance.markText(fromCursor, toCursor, {"css" : "background-color: #d9edf7"});
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
    console.log("got index", index);
    let mirrorsArray = this.mirrors.toArray();
    let cmInstance = mirrorsArray[index].codeMirrorInstance;
    cmInstance.setSelection(bookmark.from);
  }

  /* Highlights is a special case of bookmarks */
  private addHighlight(index: number, tokenID: number) {
    let mirrorsArray = this.mirrors.toArray();
    let cmInstance = mirrorsArray[index].codeMirrorInstance;

    let doc = this.documentsService.getDocument(index);

    let fragments: string[] = [];
    for( let t = tokenID; t < tokenID + 4; t++) {
      fragments.push(doc.token_lookup[t].word);
    }
    let text = fragments.join(" ");

    let tokenBounds = doc.getTokenBounds(tokenID);
    let fromCursor = tokenBounds.anchor;
    let toCursor = tokenBounds.head;

    console.log("addHighlight", fromCursor, toCursor);

    //cmInstance.markText(fromCursor, toCursor, {"css" : "background-color: #d9edf7"});
    cmInstance.markText(fromCursor, toCursor, {"css" : "background-color: #d9edf7"});
    this.bookmarks.push({
      "from" : fromCursor,
      "to" : toCursor,
      "type" : "highlight",
      "style" : "bgcolor",
      "text" : text
    });
  }

  private resizeReader() {
    console.log("should now resize the reader area.");
  }

  private closeDocument() {
    console.log("should close the document now.");
  }

  @HostListener('window:resize', ['$event.target']) 
  onResize() { 
    console.log("ON THE RISE");
    if (this.mirrors.first) {
      //this.mirrors.first.codeMirrorInstance.setSize(null, "100%");
    }
  }

  private _onResize(event) {
    console.log("$event", event);
    //const newWidth = window.innerWidth - 220;
    const elem = document.getElementsByClassName("readerArea")[0];
    //console.log("elem.clientTop", elem, elem.clientTop);
    //const newHeight = window.innerHeight - elem.clientTop - 20;
    //const.
    //console.log("-----", this.elHeight);
    //if (this.mirrors.first) {
    //  this.mirrors.first.codeMirrorInstance.setSize(newWidth, newHeight);
    //}
  }

}
