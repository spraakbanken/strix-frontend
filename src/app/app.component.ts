import { Component } from '@angular/core';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { LocService } from './loc.service';
import { RoutingService } from './routing.service';
import { DocumentsService } from './documents.service';
import { OPENDOCUMENT, CLOSEDOCUMENT, CHANGELANG, INITIATE, AppState } from './searchreducer';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private searchRedux: Observable<any>;
  private openDocument = false;
  private loggedIn = false;

  private languages: string[] = ["swe", "eng"]; // TODO: Move to some config
  private selectedLanguage: string = "";

  constructor(private routingService: RoutingService, private store: Store<AppState>, private locService: LocService) {
    console.log(_.add(1, 3)); // Just to test lodash

    if (window["jwt"]) {
      this.loggedIn = true;
    }

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.pipe(filter((d) => [CHANGELANG, INITIATE].includes(d.latestAction))).subscribe((data) => {
      this.selectedLanguage = data.lang
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === OPENDOCUMENT)).subscribe((data) => {
      console.log("|openDocument");
      this.openDocument = true;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CLOSEDOCUMENT)).subscribe((data) => {
      console.log("|closeDocument");
      this.openDocument = false;
    });
  }

  private changeLanguageTo(language: string) {
    this.store.dispatch({ type: CHANGELANG, payload : language});
    // this.locService.setCurrentLanguage(language);
  }

  private gotoLogin() {
    window.location.href = `https://sp.spraakbanken.gu.se/auth/login?redirect=${window.location}`
  }

}
