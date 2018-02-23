import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import * as _ from 'lodash';

@Component({
  selector: 'rangeslider',
  template: `
    <style>
      .range {
        padding-left: 0.4em;
        padding-right: 1em;
      }
    </style>
    <nouislider [connect]="true" 
      [min]="min" 
      [max]="max" 
      [(ngModel)]="range"
      (change)="onRangeChange.emit({range: {gte: range[0], lte: range[1]}})"
      (update)="value = {range: {gte: $event[0], lte: $event[1]}}"
    ></nouislider>
  `
})
export class RangesliderComponent implements OnInit {

  @Input() min : number;
  @Input() max : number;
  @Input() init;

  @Output() onRangeChange = new EventEmitter<any>();
  @Output() valueChange = new EventEmitter<any>();
  
  range = [];
  _value = {range : {}};

  get value() {
    return this._value;
  }

  

  @Input() 
  set value(val : any) {
    this._value = val
    this.valueChange.emit(val)
  }

  constructor() { 
  }

  ngOnInit() {
      this.range = [this.value.range.gte, this.value.range.lte]
  }

}
