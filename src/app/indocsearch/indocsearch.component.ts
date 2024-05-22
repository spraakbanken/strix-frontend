import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';
import { AppState, SEARCHINDOCUMENT, SearchRedux, HIGHLIGHT_PARALLEL } from '../searchreducer';
import { Subscription, Observable, zip } from 'rxjs';
import { filter, skip } from 'rxjs/operators';

@Component({
  selector: 'indocsearch',
  templateUrl: './indocsearch.component.html',
  styleUrls: ['./indocsearch.component.css']
})
export class IndocsearchComponent implements OnInit {
  public asyncSelected: string = "";
  private searchRedux: Observable<SearchRedux>;

  constructor(private store: Store<AppState>) { 
    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.pipe(filter((d) => d.latestAction === HIGHLIGHT_PARALLEL)).subscribe((data) => {
      this.asyncSelected = "";
      this.simpleSearch();
    });


    this.searchRedux.pipe(filter((d) => d.latestAction === SEARCHINDOCUMENT)).subscribe((data) => {
      // console.log("----", this.locService.getTranslationFor('docPs'));
      // this.paginator._intl.itemsPerPageLabel = this.locService.getTranslationFor('docPs')
      this.asyncSelected = data.localQuery;
    });
  }

  ngOnInit() {
  }

  public simpleSearch() {
    this.store.dispatch({ type: SEARCHINDOCUMENT, payload : this.asyncSelected});
  }

}
