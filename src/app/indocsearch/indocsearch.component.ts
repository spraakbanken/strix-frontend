import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';
import { AppState, SEARCHINDOCUMENT } from '../searchreducer';

@Component({
  selector: 'indocsearch',
  templateUrl: './indocsearch.component.html',
  styleUrls: ['./indocsearch.component.css']
})
export class IndocsearchComponent implements OnInit {
  public asyncSelected: string = "";

  constructor(private store: Store<AppState>) { }

  ngOnInit() {
  }

  public simpleSearch() {
    this.store.dispatch({ type: SEARCHINDOCUMENT, payload : this.asyncSelected});
  }

}
