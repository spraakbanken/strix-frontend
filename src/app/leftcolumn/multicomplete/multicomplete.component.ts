import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';


import { Bucket } from "../../strixresult.model";
import * as _ from 'lodash';


@Component({
  selector: 'multicomplete',
  templateUrl: './multicomplete.component.html',
  styleUrls: ['./multicomplete.component.css']

})
export class MultiCompleteComponent implements OnInit {

    @Input() buckets : Bucket[];
    @Output() onSelect = new EventEmitter<Bucket>();
    @Output() onRemove = new EventEmitter<Bucket>();

    private typeaheadSelected : string = "";

    private selected : Bucket[] = [];
    private remaining : Bucket[] = [];

    constructor() {
        // console.log("this.data", this.buckets)
        // this.remaining = this.buckets;
    }
    ngOnInit() {
        console.log("ngOnInit", this.buckets)
        this.remaining = _.clone(this.buckets);
    }

    private onInputClick(event) {
      if(window.outerHeight - event.target.getBoundingClientRect().bottom < 300) {
          event.target.scrollIntoView()
      }
    }
    private onDeselect(bucket : Bucket) {
        this.remaining.push(bucket) 
        this.remaining = _.sortBy(this.remaining, "key")
        this.selected.splice(this.selected.indexOf(bucket), 1)
        this.onRemove.emit(bucket)
    }
    private dropdownSelected(match) {
      let selectedItem : Bucket = match.item;
      console.log("dropdownSelected", selectedItem)
      // let bucket : Bucket = _.find(this.aggregations[aggKey].buckets, (item) => item.key == selectedItem.item.key)
      // this.chooseBucket(aggKey, bucket)
      this.onSelect.emit(selectedItem)
      this.selected.push(selectedItem)
      this.remaining.splice(this.remaining.indexOf(selectedItem), 1)
      this.typeaheadSelected = "";
    }

}