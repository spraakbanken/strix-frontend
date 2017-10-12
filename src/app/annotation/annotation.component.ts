import { Component, OnInit, Input } from '@angular/core';

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

  private basePart: string;
  private posPart: string;
  private indexPart: string;

  private stringPart: string = null;
  private confidence: string = null;

  constructor() { }

  ngOnInit() {
    console.log("ngOnInit", this.translations, this.type, this.data, this.name);
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

}
