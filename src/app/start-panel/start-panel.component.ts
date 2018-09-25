import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { SEARCH, OPENDOCUMENT, AppState } from '../searchreducer';

@Component({
  selector: 'start-panel',
  templateUrl: './start-panel.component.html',
  styleUrls: ['./start-panel.component.css']
})
export class StartPanelComponent implements OnInit {

  public show = true;

  private searchRedux: Observable<any>;

  constructor(private store: Store<AppState>) {
    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.pipe(filter((d) => this.influences(d.latestAction))).subscribe((data) => {
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
