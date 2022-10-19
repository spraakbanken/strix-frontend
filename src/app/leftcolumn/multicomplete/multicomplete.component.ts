import { Component, OnInit, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';


import { Bucket } from "../../strixresult.model";
import * as _ from 'lodash';
import { OnChanges } from '@angular/core';



@Component({
  selector: 'multicomplete',
  templateUrl: './multicomplete.component.html',
  styleUrls: ['./multicomplete.component.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush

})
export class MultiCompleteComponent implements OnInit, OnChanges {

    @Input() locConf : any;
    @Input() buckets : Bucket[];
    @Output() onSelect = new EventEmitter<Bucket>();
    @Output() onRemove = new EventEmitter<Bucket>();

    public typeaheadSelected : string = "";

    public selected : Bucket[] = [];
    public remaining : Bucket[] = [];
    public head : Bucket[] = [];

    constructor() {

    }
    ngOnInit() {
        console.log("multi locConf", this.locConf)
        // this.remaining = _.orderBy(_.cloneDeep(this.buckets), "doc_count", "desc");
        this.updateData();

    }
    ngOnChanges() {
      // console.log("ngOnChanges +", this.buckets)
      this.updateData();
    }

    private updateData() {
      let sortedBuckets =  _.orderBy(this.buckets, "doc_count", "desc");
      this.head = sortedBuckets.slice(0, 3)
      sortedBuckets = sortedBuckets.slice(3)
      this.selected = _.filter(sortedBuckets, "selected")
      this.remaining = _.filter(sortedBuckets, (item) => !item.selected)
    }

    private getLocString(key : string) {
      if(this.locConf && this.locConf.translation_value) {
        return this.locConf.translation_value[key]
      } else {
        return key
      }
    }
    public getRemaining() {
        return this.remaining;
    }

    public onInputClick(event) {
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
    private selectFromHead(bucket : Bucket) {
      bucket.selected = true
      this.onSelect.emit(bucket)
    }
    public dropdownSelected(match) {
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
