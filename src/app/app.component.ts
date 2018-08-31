import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { RoutingService } from './routing.service';
import { OPENDOCUMENT, CLOSEDOCUMENT, CHANGELANG, INITIATE, AppState } from './searchreducer';
import { LocService } from './loc.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private searchRedux: Observable<any>;
  private openDocument = false;
  private loggedIn = false;

  public languages: string[];
  public selectedLanguage: string;

  constructor(private routingService: RoutingService, private store: Store<AppState>, private locService: LocService) {
    console.log(_.add(1, 3)); // Just to test lodash

    if (window["jwt"]) {
      this.loggedIn = true;
    }

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.filter((d) => d.latestAction === CHANGELANG || d.latestAction === INITIATE).subscribe((data) => {
      this.selectedLanguage = data.lang;
    });

    this.searchRedux.filter((d) => d.latestAction === OPENDOCUMENT).subscribe((data) => {
      console.log("|openDocument");
      this.openDocument = true;
    });

    this.searchRedux.filter((d) => d.latestAction === CLOSEDOCUMENT).subscribe((data) => {
      console.log("|closeDocument");
      this.openDocument = false;
    });

    this.languages = this.locService.getAvailableLanguages();
    // Get 3-letter correspondents of user's preferred languages.
    let userLanguages = _.values(_.pick(LocService.LOCALE_MAP, window.navigator.languages || [window.navigator.language]));
    // Choose first supported user language. If none, default to first supported language.
    let language = _.head(_.intersection(userLanguages, this.languages)) || this.languages[0];
    this.selectedLanguage = language;
    this.locService.setCurrentLanguage(language);
  }

  public changeLanguageTo(language: string) {
    this.store.dispatch({ type: CHANGELANG, payload : language});
  }

  public gotoLogin() {
    window.location.href = `https://sp.spraakbanken.gu.se/auth/login?redirect=${window.location}`
  }

}
