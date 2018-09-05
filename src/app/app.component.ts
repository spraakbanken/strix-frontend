import { Component } from '@angular/core';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { LocService } from './loc.service';
import { RoutingService } from './routing.service';
import { CHANGELANG, AppState } from './searchreducer';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private openDocument = false;
  private loggedIn = false;

  public languages: string[];
  public selectedLanguage: string;

  constructor(private routingService: RoutingService, private store: Store<AppState>, private locService: LocService) {
    console.log(_.add(1, 3)); // Just to test lodash

    if (window["jwt"]) {
      this.loggedIn = true;
    }

    this.store.select('ui').subscribe(ui => {
      this.selectedLanguage = ui.lang;
    });

    this.store.select('document').subscribe((document) => {
      console.log(document.open ? "|openDocument" : "|closeDocument");
      this.openDocument = document.open;
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
