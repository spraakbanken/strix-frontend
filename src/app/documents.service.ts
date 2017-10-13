import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription }   from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
//import 'rxjs/add/observable/of';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';

import { CallsService } from './calls.service';
import { QueryService } from './query.service';
import { StrixDocument } from './strixdocument.model';
import { StrixResult } from './strixresult.model';
import { StrixMessage } from './strixmessage.model';
import { StrixEvent } from './strix-event.enum';
import { OPENDOCUMENT } from './searchreducer';
import { CLOSEDOCUMENT } from './searchreducer';

interface AppState {
  searchRedux: any;
}

/**
 * The DocumentsService is responsible for collecting a document and making sure that all
 * conserned components know about it. Each components should subscribe to the
 *  loadedDocument$ stream.
 *
 * The 'documents' array should always contain all open documents. The index of each document
 * in this array should correspond to the 'meta numbers' of the dump. (See below!)
 */


@Injectable()
export class DocumentsService {

  private searchRedux: Observable<any>;

  private loadedDocument = new Subject<StrixMessage>();
  private errorMessage: string;

  // The actual storage of the open documents.
  // It needs not be in the same order as what the user sees:
  private documents: StrixDocument[] = [];

  private referencesToDocuments: any = {};
  private mainReaderDocumentID: string = null;

  private readonly DOC_ID_PREFIX_LENGTH = 4;
  private readonly LINE_NUM_PREFIX_LENGTH = 8;

  loadedDocument$ = this.loadedDocument.asObservable();

  private docLoadingStatusSubject = new BehaviorSubject<StrixEvent>(StrixEvent.INIT);
  docLoadingStatus$ = this.docLoadingStatusSubject.asObservable();

  constructor(private callsService: CallsService,
              private queryService: QueryService,
              private store: Store<AppState>) {

    this.searchRedux = this.store.select('searchRedux');
    console.log("in documents constructor");
    this.searchRedux.filter((d) => d.latestAction === OPENDOCUMENT).subscribe((data) => {
      console.log("open document with", data, this.queryService);
<<<<<<< HEAD
      if (data.localQuery && data.localQuery !== "") {
        // Reopen the current document with the new query
        this.loadDocumentWithQuery(data.documentID, data.documentCorpus, data.localQuery || "");
      } else {
        // Open a new document in the ordinary way
        this.loadDocumentWithQuery(data.documentID, data.documentCorpus, this.queryService.getSearchString() || "", this.queryService.getInOrderFlag());
      }
=======
      let query = ""
>>>>>>> worked on localization for leftcolumn
      
      this.loadDocumentWithQuery(
         data.documentID,
         data.documentCorpus,
         data.localQuery || this.queryService.getSearchString() || "",
         null,
         data.sentenceID || null);
    
    });
  }

  /* A simple reference counting mechanism for keeping track of
    opened instances a document. The GUI should call this method
    when a reader is closed to decrease the count, and if the count
    is 0, delete the document from the browser's memory. */
  public letGoOfDocumentReference(documentID: string) {
    console.log("letting go of document reference for", documentID);
    this.referencesToDocuments[documentID]--;
    console.log("new reference count", this.referencesToDocuments[documentID]);
    if (this.referencesToDocuments[documentID] === 0) {
      this.unloadDocument(documentID);
    }
  }
  public closeMainDocument() {
    // Unload the document
    this.letGoOfDocumentReference(this.documents[0].doc_id); // Is [0] always the main document?
    // Notify the GUI
    this.store.dispatch({type: CLOSEDOCUMENT, payload : ""});
    //this.signalClosedMainDocument()
  }

  private addDocumentReference(documentID): void {
    if (! this.referencesToDocuments[documentID]) this.referencesToDocuments[documentID] = 0;
    this.referencesToDocuments[documentID]++;
  }

  /* This should be called when the reference count for a document is 0. */
  private unloadDocument(documentID: string): void {
    console.log("unloading the document", documentID);
    for (let i = 0; i < this.documents.length; i++) {
      if (this.documents[i].doc_id === documentID) {
        this.documents.splice(i);
        break;
      }
    }
  }

  /* Loading a document as a whole. */
  public loadDocument(documentID: string, corpusID: string, highlights: any, newReader = false): void {

    if (! newReader) {
      console.log("loading the document in the main reader.")
      // Decrease the count (and possibly delete) the old main document
      if (this.mainReaderDocumentID) this.letGoOfDocumentReference(this.mainReaderDocumentID);
      this.mainReaderDocumentID = documentID;
    }

    this.addDocumentReference(documentID);

    this.callsService.getDocument(documentID, corpusID)
        .subscribe(
          answer => {

            console.log("answer", answer);

            // We should only add the document if it isn't already in the documents array
            let added = false;
            let index = -1;
            for (let i = 0; i < this.documents.length; i++) {
              let doc = this.documents[i];
              console.log("doc_id", answer.doc_id, doc.doc_id);
              if (doc && doc.doc_id && doc.doc_id === answer.doc_id) {
                added = true;
                index = i;
              }
            }

            if (! added) {

              index = this.addDocumentToDocuments(answer);
              this.preprocessDocument(answer, index);

              /* This is a wacky hack to make the CodeMirror
                parser know something about the current state */
              window['CodeMirrorStrix'] = this.documents;
            }

            /* Inform other components that the document has been opened: */
            let message = new StrixMessage(index, newReader);
            this.loadedDocument.next(message);

          },
          error => this.errorMessage = <any>error
        );
  }

  public loadDocumentWithQuery(documentID: string, corpusID: string, query: string, inOrder: boolean = true, sentenceID = null): void {
    console.log("loading the document in the main reader.", inOrder)
    this.signalStartedDocumentLoading();
    // Decrease the count (and possibly delete) the old main document
    if (this.mainReaderDocumentID) this.letGoOfDocumentReference(this.mainReaderDocumentID);
    this.mainReaderDocumentID = documentID;

    this.addDocumentReference(documentID);

    let service$ : Observable<any> = sentenceID ? this.callsService.getDocumentBySentenceID(corpusID, sentenceID) : this.callsService.getDocumentWithQuery(documentID, corpusID, query, inOrder)
    service$.subscribe(
          answer => {
            console.log("answer", answer);

            // We should only add the document if it isn't already in the documents array
            let added = false;
            let index = -1;
            for (let i = 0; i < this.documents.length; i++) {
              let doc = this.documents[i];
              console.log("doc_id", answer.doc_id, doc.doc_id);
              if (doc && doc.doc_id && doc.doc_id === answer.doc_id) {
                added = true;
                index = i;
              }
            }

            if (! added) {

              index = this.addDocumentToDocuments(answer);
              this.preprocessDocument(answer, index);

              /* This is a wacky hack to make the CodeMirror
                parser understand something about the current state */
              window['CodeMirrorStrix'] = this.documents;
            }

            /* Inform other components that the document has been opened: */
            let message = new StrixMessage(index, false); // false = new reader (which we don't use anymore...)
            this.loadedDocument.next(message);
            this.signalEndedDocumentLoading();

          },
          error => this.errorMessage = <any>error
        );
  }

  public getDocument(index: number) : StrixDocument {
    return this.documents[index];
  }

  /* Add a document to the first empty (null) spot of this.documents, or
    to the end of the array if there is no empty spot. Returns the index. */
  private addDocumentToDocuments(document: StrixDocument) : number {
    let index = -1;
    for (let i = 0; i < this.documents.length; i++) {
      if (this.documents[i] === null) {
        this.documents[i] = document;
        index = i;
      }
    }

    if (index === -1) {
      this.documents.push(document);
      index = this.documents.length - 1;
    }

    if (! window['CodeMirrorStrixControl']) window['CodeMirrorStrixControl'] = [];
    window['CodeMirrorStrixControl'][index] = {};

    console.log("this.documents", this.documents);

    return index;
  }

  /* All preprocessing of a document before use. */
  private preprocessDocument(document : StrixDocument, documentIndex : number) {
    this.addMetaNumbers(document.dump, documentIndex);
    document.index = documentIndex;
  }

  /*
    The meta numbers identify the current file index in the documents array
    and the current line number. This is a wacky hack to make the CodeMirror
    parser understand something about the current app state when it does the
    coloring. It will use the state to figure out the token ids and use these
    to get the annotations. More about this in 'cm.directive.ts'.
  */
  private addMetaNumbers(dump : string[], documentIndex : number) {
    for (let i = 0; i < dump.length; i++) {
      let documentIndexPart = _.padStart((documentIndex).toString(), this.DOC_ID_PREFIX_LENGTH, '0');
      let lineNumberPart = _.padStart(i.toString(), this.LINE_NUM_PREFIX_LENGTH, '0');
      dump[i] = documentIndexPart + lineNumberPart + dump[i].replace(/\n/g, '');
    }
  }

  /*
   Returns an observable with the token ID of the next (or previous) match.
  */
  // TODO: Refactor into some kind of object so we avoid 5 parameters.
  public searchForAnnotation(documentIndex: number, annotationKey: string, annotationValue: string, currentPosition: number, backwards: boolean) : Observable<number> {
    let doc = this.documents[documentIndex];
    let callObj = {
      "corpusID" : doc.corpusID,
      "elasticID" : doc.doc_id,
      "annotationKey" : annotationKey,
      "annotationValue" : annotationValue,
      "currentPosition" : currentPosition,
      "backwards" : backwards
    };
    return this.callsService.searchDocumentForAnnotation(callObj).map((answer) => {
      console.log("the real answer", answer);
      return answer.highlight[0].attrs.wid;
    });
  }

  private signalStartedDocumentLoading() {
    this.docLoadingStatusSubject.next(StrixEvent.DOCLOADSTART);
  }
  private signalEndedDocumentLoading() {
    this.docLoadingStatusSubject.next(StrixEvent.DOCLOADEND);
  }
  /* private signalClosedMainDocument() {
    this.docLoadingStatusSubject.next(StrixEvent.CLOSED_MAIN_DOCUMENT);
  } */

  private tokenInfoDone = new Subject<boolean>();
  public tokenInfoDone$ = this.tokenInfoDone.asObservable();

  public extendTokenInfoIfNecessary(docIndex: number, fromLine: number, toLine: number): void {
    // First convert line numbers to token numbers
    let doc = this.documents[docIndex];
    
    // Get some more lines so we more likely have enough for the viewport when coloring
    fromLine = Math.max(fromLine - 20, 0);

    toLine += 20;

    let firstToken = doc.getFirstTokenFromLine(fromLine);
    let lastToken = doc.getLastTokenFromLine(toLine);
    console.log("lastToken", lastToken);
    if (lastToken === -1) {
      console.log("getting the LAST token in the document.")
      lastToken = doc.getLastTokenFromDocument();
    }
    
    console.log("from token ", firstToken, " to ", lastToken);

    // Only make calls if we don't have the data already!
    let missing = false;
    for (let i = fromLine; i <= toLine; i++) {
      let firstTokenOnTheLine = doc.getFirstTokenFromLine(i);
      //console.log("->", i, firstTokenOnTheLine, doc.token_lookup[firstTokenOnTheLine]);
      if (! doc.token_lookup[firstTokenOnTheLine]) {
        missing = true;
        break;
      }
    }

    if (missing) {

      this.callsService.getTokenDataFromDocument(doc.doc_id, doc.corpusID, firstToken, lastToken).subscribe(
        answer => {
          //console.log( "size of new", _.size(answer.data.token_lookup), answer.data.token_lookup);
          _.assign(doc.token_lookup, doc.token_lookup, answer.data.token_lookup);
          console.log( "size:", _.size(doc.token_lookup) );

          this.tokenInfoDone.next(true);
        },
        error => {
          this.errorMessage = <any>error;
          this.tokenInfoDone.next(false);
        }
      );

    } else {
      console.log("we're set already!")
      this.tokenInfoDone.next(false);
    }

    //return null;
  }

  public getRelatedDocuments(docIndex: number) {
    let doc = this.documents[docIndex];
    return this.callsService.getRelatedDocuments(doc.doc_id, doc.corpusID);
  }

}
