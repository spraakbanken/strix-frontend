import { Component, OnInit } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';

import { DocumentsService } from '../documents.service';
import { MetadataService } from '../metadata.service';
import { ReaderCommunicationService } from '../reader-communication.service';
import { CallsService } from '../calls.service';
import { StrixDocument } from '../strixdocument.model';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { LocService } from '../loc.service';
import { AppState, CLOSEDOCUMENT, MODE_SELECTED } from '../searchreducer';

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
  public wordAnnotations = [];
  public selectedAnnotation: string;
  public selectedAnnotationValue: string;
  public selectedAnnotationStructuralType = 'token';
  public structuralAnnotations = [];
  private currentCorpusID: string;
  private currentDocumentID: string;
  public currentMode: string;

  private searchRedux: Observable<any>;

  private errorMessage;

  private annotationValues = [];

  constructor(private documentsService: DocumentsService,
              private metadataService: MetadataService,
              private callsService: CallsService,
              private readerCommunicationService: ReaderCommunicationService,
              private locService: LocService,
              private store: Store<AppState>,) {

  this.searchRedux = this.store.select('searchRedux');

  this.searchRedux.pipe(filter((d) => d.latestAction === CLOSEDOCUMENT)).subscribe((data) => {
    this.selectedAnnotation = undefined;
    this.selectedAnnotationValue = '';
    this.annotationValues = [];
  });

  this.searchRedux.pipe(filter((d) => d.latestAction === MODE_SELECTED)).subscribe((data) => {
    this.currentMode = data.modeSelected[0];
  });
  }

  ngOnInit() {
    this.subscription = this.documentsService.loadedDocument$.subscribe(
      message => {
        // console.log("A document has been fetched.", message);
        this.mainDocument = this.documentsService.getDocument(message.documentIndex);

        this.currentCorpusID = this.mainDocument.corpusID;
        this.currentDocumentID = this.mainDocument.doc_id;
        this.updateAnnotationsLists(this.currentCorpusID);
    });

    // Make sure the metadata is loaded
    this.metadataSubscription = this.metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.availableCorpora = this.metadataService.getAvailableCorpora();
          // console.log("the metadata", this.availableCorpora);
          this.gotMetadata = true;
        } else {
          this.availableCorpora = {}; // TODO: Show some error message
        }
    });

    this.readerCommunicationService.event$.subscribe((data) => {
      // console.log("message from the reader communication service", data);
      const message = data["message"];
      const payload = data["payload"];
      if (message === "changeAnnotationHighlight") {
        //this.selectedAnnotation = payload["annotation"];
        // console.log("payload av", payload["annotationValue"]);
        if (payload["annotationStructuralType"] !== this.selectedAnnotationStructuralType) {
          this.selectAnnotationStructuralType(payload["annotationStructuralType"]);
        }
        if (payload["annotation"] !== this.selectedAnnotation) {
          this.selectAnnotation(payload["annotation"]);
        }
        this.selectedAnnotationValue = payload["annotationValue"];
      };
    });
  }

  private updateAnnotationsLists(corpusID: string) {
    this.wordAnnotations = this.metadataService.getWordAnnotationsFor(corpusID);
    this.structuralAnnotations = this.metadataService.getStructuralAnnotationsFor(corpusID);
    this.structuralAnnotations = this.structuralAnnotations.filter(item => !["page", "sentence"].includes(item.name))
    // console.log("this.structuralAnnotations", this.structuralAnnotations);
  }

  public selectAnnotationStructuralType(structuralType: string) {
    this.selectedAnnotationStructuralType = structuralType || "token";
    this.selectedAnnotation = undefined;
    // console.log("structural attributes", this.structuralAnnotations);
  }

  private getStructuralAttributeGroup(name: string) {
    return _.find(this.structuralAnnotations, (obj) => obj.name === name);
  }

  public selectAnnotation(annotation: string, structure: string = null) {
    // console.log("selectAnnotation", annotation);
    this.selectedAnnotationValue = "";
    this.selectedAnnotation = annotation;
    this.annotationValues = [];
    let augAnnotation = annotation;
    if (structure) {
      augAnnotation = `${structure}.${augAnnotation}`;
    }
    // Getting the annotation values for the selected annotation
    this.callsService.getValuesForAnnotation(this.currentCorpusID, this.currentDocumentID, augAnnotation)
    .subscribe(
      answer => {
        let values = answer.aggregations[augAnnotation].buckets;
        this.annotationValues = values;
      },
      error => this.errorMessage = <any>error
    );
  }

  private pretty(input) {
    return this.locService.getPrettyNumberString(input);
  }
  private getTranslation(input) {
    return this.locService.getTranslationFor(input);
  }

  private selectAnnotationValue(annotationValue: string) {
    if (annotationValue && annotationValue !== "") {
      this.selectedAnnotationValue = annotationValue;
      this.readerCommunicationService.changeAnnotationHighlight(this.selectedAnnotation, this.selectedAnnotationStructuralType, this.selectedAnnotationValue);
    }
  }

  private goToNextAnnotation() {
    this.readerCommunicationService.goToNextAnnotation(this.selectedAnnotation, this.selectedAnnotationStructuralType, this.selectedAnnotationValue);
  }
  private goToPreviousAnnotation() {
    this.readerCommunicationService.goToPreviousAnnotation(this.selectedAnnotation, this.selectedAnnotationStructuralType, this.selectedAnnotationValue);
  }

  private getAnnotation() {
    let annotations;
    if (this.selectedAnnotationStructuralType === "token") {
      annotations = this.wordAnnotations;
    } else {
      annotations = this.getStructuralAttributeGroup(this.selectedAnnotationStructuralType).attributes;
    }
    return _.find(annotations, (item) => item["name"] === this.selectedAnnotation);
  }

  private getAnnotationType(): string {
    if (this.getAnnotation()) {
      return this.getAnnotation()["type"];
    } else {
      return ''
    }
    
  }

  public getAnnotationTranslation() {
    let annotation = this.getAnnotation();
    if (!annotation) {
      return null;
    }
    if (annotation["translation_name"]) {
      return annotation["translation_name"];
    } else {
      if (annotation["type_info"] && annotation["type_info"].translation_value) {
        return annotation["type_info"].translation_value;
      }
    }
    return null;
  }

  private getTranslations() {
    let annotation = this.getAnnotation();
    if (annotation !== undefined && annotation.translation_value) {
      return annotation.translation_value;
    } else {
      if (annotation !== undefined && annotation.type_info && annotation.type_info.translation_value) {
        return annotation.type_info.translation_value;
      } else {
        return {};
      }
    }
  }

}
