import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'annotation',
  templateUrl: './annotation.component.html',
  styleUrls: ['./annotation.component.css']
})
export class AnnotationComponent implements OnInit {

  @Input() data: any;
  @Input() type: string;

  private basePart: string;
  private posPart: string;
  private indexPart: string;

  constructor() { }

  ngOnInit() {
    switch(this.type) {
      case 'lemgram':
        let parts = this.data.split("..");
        this.basePart = parts[0];
        let lastParts = parts[1].split(".");
        this.posPart = lastParts[0];
        this.indexPart = lastParts[1];
        break;
    }
  }

  private clickedKarp(event) {
    event.stopPropagation();
  }

}
