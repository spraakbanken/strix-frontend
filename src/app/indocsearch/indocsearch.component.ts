import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';
import { SEARCHINDOCUMENT } from '../searchreducer';

interface AppState {
  searchRedux: any;
}

@Component({
  selector: 'indocsearch',
  templateUrl: './indocsearch.component.html',
  styleUrls: ['./indocsearch.component.css']
})
export class IndocsearchComponent implements OnInit {
  private asyncSelected: string = "";

  constructor(private store: Store<AppState>) { }

  ngOnInit() {
  }

  private simpleSearch() {
    this.store.dispatch({ type: SEARCHINDOCUMENT, payload : this.asyncSelected});
  }

}
