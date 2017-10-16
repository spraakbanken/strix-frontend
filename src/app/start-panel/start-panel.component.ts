import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { SEARCH, RELOAD, OPENDOCUMENT } from '../searchreducer';

interface AppState {
  searchRedux: any;
}

@Component({
  selector: 'start-panel',
  templateUrl: './start-panel.component.html',
  styleUrls: ['./start-panel.component.css']
})
export class StartPanelComponent implements OnInit {

  private show = true;

  private searchRedux: Observable<any>;

  constructor(private store: Store<AppState>) {
    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.filter((d) => this.influences(d.latestAction)).subscribe((data) => {
      this.show = false;
    });
  }

  private influences(action: string): boolean {
    return (action === SEARCH ||
            // action === RELOAD ||
            action === OPENDOCUMENT);
  }

  ngOnInit() {
  }

}
