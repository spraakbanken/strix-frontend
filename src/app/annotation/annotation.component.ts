import { Component, OnInit, Input, TemplateRef } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { DocumentsService } from 'app/documents.service';
import * as _ from 'lodash';

@Component({
  selector: 'annotation',
  templateUrl: './annotation.component.html',
  styleUrls: ['./annotation.component.css']
})
export class AnnotationComponent implements OnInit {

  @Input() data: any;
  @Input() type: string;
  @Input() translations: any;
  @Input() name: string; // Just for change detection's sake... but it doesn't wotk anyway :S
  @Input() noKarp = false;

  basePart: string;
  posPart: string;
  indexPart: string;

  stringPart: string = null;
  confidence: string = null;

  /* IVIP */
  jwt: string = window["jwt"];
  currentResource: any;
  currentText = '';
  private currentTime = 0;
  private modalRef: BsModalRef;

  constructor(
    private documentsService: DocumentsService,
    private modalService: BsModalService
  ) { }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  ngOnInit() {
    switch(this.type) {
      case 'lemgram':
        let lemgram_parts = this.data.split("..");
        this.basePart = lemgram_parts[0];
        let lastParts = lemgram_parts[1].split(".");
        this.posPart = lastParts[0];
        this.indexPart = lastParts[1];
        break;
      case 'sense':
        let sense_parts = this.data.split("..");
        this.indexPart = sense_parts[1];
        this.basePart = sense_parts[0];
        break;
      case 'audio':
        break;
      case 'video':
        break;
      default:
        if (typeof this.data === 'string') {
          let regexp = /.*:\d+.?\d*/;
          if (regexp.test(this.data)) {
            this.stringPart = this.data.split(":")[0];
            this.confidence = this.data.split(":")[1];
          }
        }

        if (!this.stringPart) {
          this.stringPart = this.data;
        }
        break;
    }
  }

  private clickedKarp(event) {
    event.stopPropagation();
  }

  private openResource() {
    this.currentResource = this.data;
    //this.currentTime = 4000;
  }

  public getResourceUrl(): string {
    return 'https://ws.spraakbanken.gu.se/ws/strixlabb/resource/'
      + this.documentsService.getDocument(0).corpusID
      + '/' + this.currentResource.path
      + (this.jwt ? '?jwt=' + this.jwt : '');
  }

  private updateTime(time) {
    console.log("updateTime")
    let current = this.findToken(time);
    console.log("current", current);
    if (current) {
      this.currentText = current;
    }
  }

  private loadedMetadata(movieplayer) {
    console.log("loaded video metadata.", this.data.start)
    if (this.data.start) movieplayer.currentTime = this.data.start / 1000;
  }

  private findToken(timestamp) {
    let openDocument = this.documentsService.getDocument(0);
    let tokens = openDocument.token_lookup;
    let len = _.size(tokens);
    // Needs optimization with a binary search instead, or a precalculation step:
    for (let i = 0; i < len; i++) {
      let sentence = tokens[i].attrs.sentence;
      if (sentence) {
        let start = sentence.attrs.video_resource.start;
        let end = sentence.attrs.video_resource.end;
        if (start && end) {
          if (timestamp >= start/1000 && timestamp <= end/1000) {
            let startTokenIndex = sentence.start_wid;
            let endTokenIndex = startTokenIndex + sentence.length - 1;
            return this.getTextFromIndices(tokens, startTokenIndex, endTokenIndex)
          }
        }
      }
    }
  }

  private getTextFromIndices(tokenData, start, end) {
    let sentence = '';
    for (let i = start; i <= end; i++) {
      sentence += tokenData[i].word + (tokenData[i].whitespace || '')
    }
    return sentence;
  }

}
