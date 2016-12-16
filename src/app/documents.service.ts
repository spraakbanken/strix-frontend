import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { CallsService } from './calls.service';
import { StrixDocument } from './strixdocument.model';
import { StrixResult } from './strixresult.model';
import { StrixMessage } from './strixmessage.model';

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

  constructor(private callsService: CallsService) {}

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
              console.log("es_id", answer.doc_id, doc.doc_id);
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
            let message = new StrixMessage(index, newReader);
            this.loadedDocument.next(message);

          },
          error => this.errorMessage = <any>error
        );
  }

  public loadDocumentWithQuery(documentID: string, corpusID: string, highlights: any, query: string, newReader = false): void {

    if (! newReader) {
      console.log("loading the document in the main reader.")
      // Decrease the count (and possibly delete) the old main document
      if (this.mainReaderDocumentID) this.letGoOfDocumentReference(this.mainReaderDocumentID);
      this.mainReaderDocumentID = documentID;
    }

    this.addDocumentReference(documentID);

    this.callsService.getDocumentWithQuery(documentID, corpusID, query)
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
                parser understand something about the current state */
              window['CodeMirrorStrix'] = this.documents;
            }

            /* Inform other components that the document has been opened: */
            let message = new StrixMessage(index, newReader);
            this.loadedDocument.next(message);

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
      dump[i] = documentIndexPart + lineNumberPart + dump[i].replace(/\n/g,'');
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

}
