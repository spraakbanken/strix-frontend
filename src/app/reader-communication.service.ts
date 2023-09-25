import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/* This service is used for components to communicate with the open document. */
@Injectable()
export class ReaderCommunicationService {
  public _subject = new Subject<object>();
  public event$ = this._subject.asObservable();
  constructor() { }

  public goToNextAnnotation(annotation: string, annotationStructuralType : string, annotationValue: string) {
    this._subject.next({message: "goToNextAnnotation", payload: {annotation: annotation,
                                                                 annotationStructuralType : annotationStructuralType,
                                                                 annotationValue: annotationValue}});
  }
  public goToPreviousAnnotation(annotation: string, annotationStructuralType : string, annotationValue: string) {
    this._subject.next({message: "goToPreviousAnnotation", payload: {annotation: annotation,
                                                                     annotationStructuralType : annotationStructuralType,
                                                                     annotationValue: annotationValue}});
  }
  public changeAnnotationHighlight(annotation: string, annotationStructuralType : string, annotationValue: string) {
    // console.log("CHANGEANNOTATIONHIGHLIGHT", annotation, annotationValue);
    this._subject.next({message: "changeAnnotationHighlight", payload: {annotation: annotation,
                                                                        annotationStructuralType : annotationStructuralType,
                                                                        annotationValue: annotationValue}});
  }
}
