import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import * as _ from 'lodash';

import { DocumentsService } from '../documents.service';
import { MetadataService } from '../metadata.service';
import { ReaderCommunicationService } from '../reader-communication.service';
import { CallsService } from '../calls.service';
import { StrixDocument } from '../strixdocument.model';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';

interface AppState {
  searchRedux: any;
}

@Component({
  selector: 'annotations-selector',
  templateUrl: './annotations-selector.component.html',
  styleUrls: ['./annotations-selector.component.css']
})
export class AnnotationsSelectorComponent implements OnInit {

  subscription : Subscription;
  private mainDocument: StrixDocument;

  /* Metadata */
  private gotMetadata = false;
  private metadataSubscription: Subscription;
  private availableCorpora: { [key: string] : StrixCorpusConfig} = {};
  private wordAnnotations = [];
  private selectedAnnotation: string;
  private selectedAnnotationValue: string;
  private structuralAnnotations = [];
  private currentCorpusID: string;
  private currentDocumentID: string;

  private errorMessage;

  private annotationValues = [];

  constructor(private documentsService: DocumentsService,
              private store: Store<AppState>,
              private metadataService: MetadataService,
              private callsService: CallsService,
              private readerCommunicationService: ReaderCommunicationService) { }

  ngOnInit() {
    this.subscription = this.documentsService.loadedDocument$.subscribe(
      message => {
        console.log("A document has been fetched.", message);

        let openedDocument = this.documentsService.getDocument(message.documentIndex);
        this.mainDocument = openedDocument;

        let wholeText = openedDocument.dump.join("\n");

        this.currentCorpusID = this.mainDocument.corpusID;
        this.currentDocumentID = this.mainDocument.doc_id;
        this.updateAnnotationsLists(this.currentCorpusID);
    });

    // Make sure the metadata is loaded
    this.metadataSubscription = this.metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.availableCorpora = this.metadataService.getAvailableCorpora();
          console.log("the metadata", this.availableCorpora);
          this.gotMetadata = true;
        } else {
          this.availableCorpora = {}; // TODO: Show some error message
        }
    });

    this.readerCommunicationService.event$.subscribe((data) => {
      console.log("message from the reader communication service", data);
      const message = data["message"];
      const payload = data["payload"];
      if (message === "changeAnnotationHighlight") {
        this.selectedAnnotationValue = payload["annotationValue"];
        this.selectAnnotation(payload["annotation"]);
      };
    });
  }

  private updateAnnotationsLists(corpusID: string) {
    this.wordAnnotations = this.metadataService.getWordAnnotationsFor(corpusID);
    this.structuralAnnotations = this.metadataService.getStructuralAnnotationsFor(corpusID);
  }

  private selectAnnotation(annotation: string) {
    console.log("selectAnnotation", annotation);
    this.selectedAnnotation = annotation;
    this.annotationValues = [];
    // Getting the annotation values for the selected annotation
    this.callsService.getValuesForAnnotation(this.currentCorpusID, this.currentDocumentID, annotation)
    .subscribe(
      answer => {
        let values = answer.aggregations[annotation].buckets;
        if (values.length <= 100) {
          this.annotationValues = values;
        }
        
        console.log("this.annotationValues", this.annotationValues);
      },
      error => this.errorMessage = <any>error
    );
  }

  private selectAnnotationValue(annotationValue: string) {
    this.selectedAnnotationValue = annotationValue;
    this.readerCommunicationService.changeAnnotationHighlight(this.selectedAnnotation, this.selectedAnnotationValue);
  }

  private goToNextAnnotation() {
    this.readerCommunicationService.goToNextAnnotation(this.selectedAnnotation, this.selectedAnnotationValue);
  }
  private goToPreviousAnnotation() {
    this.readerCommunicationService.goToPreviousAnnotation(this.selectedAnnotation, this.selectedAnnotationValue);
  }

}
