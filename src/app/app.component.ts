import { Component } from '@angular/core';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { LocService } from './loc.service';
import { CallsService } from './calls.service';
import {FormControl} from '@angular/forms';
import { RoutingService } from './routing.service';
import { OPENDOCUMENT, CLOSEDOCUMENT, CHANGELANG, INITIATE, 
        AppState, SearchRedux, SELECTED_CORPORA, MODE_SELECTED } from './searchreducer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  public listTabs = ['Hits', 'Statistic'];
  public selectedTab = new FormControl(0);
  public listDocTabs = ['docView', 'statView'];
  public selectedDocTab = new FormControl(0);
  public similarParam: any;
  public statParam: {};
  public relatedDocType: string;
  public currentSelection: string[];
  
  private searchRedux: Observable<SearchRedux>;
  public openDocument = false;
  public searchBox = true;
  public loggedIn = false;
  public selectSwe = false;
  public selectEng = true;
  public openCompare = false;
  public loginStatus = "login";
  public getDocRunning = false;
  public getStrixInfo = {};
  public selectedCorpus = [];

  public languages: string[];
  public selectedLanguage: string;
  public triggerLoading = false;

  constructor(private routingService: RoutingService, private store: Store<AppState>, private locService: LocService, private callsService: CallsService) {
    // console.log(_.add(1, 3)); // Just to test lodash

    if (window["jwt"]) {
      this.loggedIn = true;
      this.loginStatus = "logout";
    } else {
      this.loginStatus = "login";
    }

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.pipe(filter((d) => [CHANGELANG, INITIATE].includes(d.latestAction))).subscribe((data) => {
      this.selectedLanguage = data.lang;
      // this.callsService.getInfoStrix().subscribe((infoStrix) => {
      //   this.getStrixInfo = infoStrix;
      // }); 
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === INITIATE)).subscribe((data) => {
      this.triggerLoading = true;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === SELECTED_CORPORA)).subscribe((data) => {
      this.selectedCorpus = data.selectedCorpora;
      if (this.selectedCorpus.length > 0) {
        this.triggerLoading = false;
      }
    })

    this.searchRedux.pipe(filter((d) => d.latestAction === MODE_SELECTED)).subscribe((data) => {
      this.statParam = {};
      this.statParam['hello'] = 'world';
      this.listTabs = ['Hits', 'Statistic'];
      this.selectedTab.setValue(0);
    })

    this.searchRedux.pipe(filter((d) => d.latestAction === OPENDOCUMENT)).subscribe((data) => {
      // console.log("|openDocument");
      this.openDocument = true;
      this.getDocRunning = true;
      this.searchBox = false;
      
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CLOSEDOCUMENT)).subscribe((data) => {
      // console.log("|closeDocument");
      this.openDocument = false;
      this.getDocRunning = false;
      this.searchBox = true;
      this.openCompare = false;
      this.selectedDocTab.setValue(0);
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
    if (language === "swe") {
      this.selectSwe = true;
      this.selectEng = false;
    }
    if (language === "eng") {
      this.selectSwe = false;
      this.selectEng = true;
    }
  }

  public addTab() {
    this.listTabs.push('Tab');
    this.selectedTab.setValue(this.listTabs.length - 1);
  }

  public removeTab(index: number) {
    this.listTabs.splice(index, 1);
    this.selectedTab.setValue(0);
  }

  public gotoLogin() {
    window.location.href = `https://sp.spraakbanken.gu.se/auth/login?redirect=${window.location}`
  }

  public gotoLogout() {
    window.location.href = `https://sp.spraakbanken.gu.se/Shibboleth.sso/Logout`
  }

  public reloadStrix() {
    window.location.href = window.location.pathname;
  }

  public getLangchange(iKey: string) {
    return this.locService.getDataLanguage(iKey)
  }
}
