import { Component, OnInit } from '@angular/core';
import { filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { SEARCH, OPENDOCUMENT, AppState } from '../searchreducer';

@Component({
  selector: 'start-panel',
  templateUrl: './start-panel.component.html',
  styleUrls: ['./start-panel.component.css']
})
export class StartPanelComponent implements OnInit {

  private show = true;

  constructor(private store: Store<AppState>) {
    this.store.select('ui').pipe(filter((d) => this.influences(d.latestAction))).subscribe(() => {
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
