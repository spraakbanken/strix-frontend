import { Component, OnInit, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';


import { Bucket } from "../../strixresult.model";
import * as _ from 'lodash';



@Component({
  selector: 'multicomplete',
  templateUrl: './multicomplete.component.html',
  styleUrls: ['./multicomplete.component.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush

})
export class MultiCompleteComponent implements OnInit {

    @Input() locConf : any;
    @Input() buckets : Bucket[];
    @Output() onSelect = new EventEmitter<Bucket>();
    @Output() onRemove = new EventEmitter<Bucket>();

    private typeaheadSelected : string = "";

    private selected : Bucket[] = [];
    private remaining : Bucket[] = [];

    constructor() {

    }
    ngOnInit() {
        console.log("multi locConf", this.locConf)
        // this.remaining = _.orderBy(_.cloneDeep(this.buckets), "doc_count", "desc");
        for(let item of this.buckets) {
          if(item.selected) {
            this.selected.push(item)
          } else {
            this.remaining.push(item)
          }
        }
        this.remaining = _.orderBy(this.buckets, "doc_count", "desc");

    }
    private getLocString(key : string) {
      if(this.locConf && this.locConf.translation_value) {
        return this.locConf.translation_value[key]
      } else {
        return key
      }
    }
    private getRemaining() {
        return this.remaining;
    }

    private onInputClick(event) {
      if(window.outerHeight - event.target.getBoundingClientRect().bottom < 300) {
          event.target.scrollIntoView()
      }
    }
    private onDeselect(bucket : Bucket) {
        this.remaining.push(bucket) 
        this.remaining = _.orderBy(this.remaining, "doc_count", "desc")
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