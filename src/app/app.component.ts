import { Component } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { RoutingService } from './routing.service';
import { DocumentsService } from './documents.service';
import { OPENDOCUMENT, CLOSEDOCUMENT } from './searchreducer';

interface AppState {
  searchRedux: any;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private searchRedux: Observable<any>;
  private openDocument = false;

  constructor(private routingService: RoutingService, private store: Store<AppState>) {
    console.log(_.add(1, 3)); // Just to test lodash

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.filter((d) => d.latestAction === OPENDOCUMENT).subscribe((data) => {
      console.log("|openDocument");
      this.openDocument = true;
    });

    this.searchRedux.filter((d) => d.latestAction === CLOSEDOCUMENT).subscribe((data) => {
      this.openDocument = false;
    });
  }

}
