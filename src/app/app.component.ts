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
        AppState, SearchRedux, SELECTED_CORPORA, MODE_SELECTED, 
        VECTOR_SEARCH_BOX,
        CHANGEQUERY,
        VECTOR_SEARCH,
        HOMEVIEW,
        GOTOQUERY} from './searchreducer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  public listTabs = ['Hits', 'Statistics', 'Overview'];
  public listTabsV = ['Semantic'];
  public selectedTab = new FormControl(0);
  public selectedTabV = new FormControl(0);
  public listDocTabs = ['docView', 'statView'];
  public selectedDocTab = new FormControl(0);
  public listViewTabs = ['Topics', 'Maps'];
  public selectedViewTab = new FormControl(0);
  public similarParam: any;
  public statParam: {};
  public relatedDocType: string;
  public currentSelection: string[];
  public currentCount = 1;
  public vectorString = "";

  //
  public showSource = 'source';
  public showTarget = 'target';
  public currentMode = '';
  //
  
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
  public viewMap: string;
  public viewTopic: string;
  public loadStatus = 0;
  public hideHome = false;
  public availableCorpora = { 
    'vivill': {'swe': 'Svenska partiprogram och valmanifest', 'eng': 'Swedish party programs and election manifestos'},
    'wikipedia-sv-demo':  {'swe': 'Svenska Wikipedia demo (april 2022)', 'eng': 'Swedish Wikipedia demo (april 2022)'},
    'detektivaavdelningen':  {'swe': 'Detektiva avdelningen', 'eng': 'Detektiva avdelningen'},
    'lb-open-demo':  {'swe': 'Litteraturbanken demo: fria verk', 'eng': 'The Swedish Literature Bank demo: Free Works'},
  };

  public languages: string[];
  public selectedLanguage: string;
  public triggerLoading = false;
  public activeVectorSearch = false;

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
      if (_.keys(data.filters).length > 0) {
        this.hideHome = true
      }
      this.triggerLoading = true;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === VECTOR_SEARCH_BOX)).subscribe((data) => {
      if (data.vectorQuery !== undefined) {
        this.vectorString = data.vectorQuery;
      } else {
        this.vectorString = '';
      }
      // console.log(data.vectorSearch)
      this.activeVectorSearch = data.vectorSearchbox;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === SELECTED_CORPORA)).subscribe((data) => {
      if (this.loadStatus > 2) {
        this.hideHome = true
      } else {
        this.loadStatus = this.loadStatus + 1
      }
      this.selectedCorpus = data.selectedCorpora;
      if (this.selectedCorpus.length > 0) {
        this.triggerLoading = false;
      }
    })

    this.searchRedux.pipe(filter((d) => d.latestAction === CHANGEQUERY)).subscribe((data) => {
      if (this.loadStatus > 2) {
        this.hideHome = true
      } else {
        this.loadStatus = this.loadStatus + 1
      }
    })

    this.searchRedux.pipe(filter((d) => d.latestAction === VECTOR_SEARCH)).subscribe((data) => {
      if (this.loadStatus > 2) {
        this.hideHome = true
      } else {
        this.loadStatus = this.loadStatus + 1
      }
    })

    this.searchRedux.pipe(filter((d) => d.latestAction === MODE_SELECTED)).subscribe((data) => {
      if (this.loadStatus > 2) {
        this.hideHome = true
      } else {
        this.loadStatus = this.loadStatus + 1
      }
      this.currentMode = data.modeSelected[0];
      this.statParam = {};
      this.statParam['hello'] = 'world';
      this.listTabs = ['Hits', 'Statistics', 'Overview'];
      this.listTabsV = ['Semantic']
      this.selectedTab.setValue(0);
      this.selectedTabV.setValue(0);
      this.viewMap = '';
      this.viewTopic = '';
      this.selectedViewTab.setValue(0);
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

  public addTabV() {
    this.listTabsV.push('Tab');
    this.selectedTabV.setValue(this.listTabsV.length - 1);
  }

  public removeTabV(index: number) {
    this.listTabsV.splice(index, 1);
    this.selectedTabV.setValue(0);
  }

  public removeViewTab(index: number) {
    this.listViewTabs.splice(index, 1);
    this.selectedViewTab.setValue(0);
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

  public showOverview() {
    this.viewTopic = this.listViewTabs[0];
    this.currentCount = this.currentCount + 1
  }

  public gotoCorpora(mode: string, corpora: string) {
    this.store.dispatch({ type: HOMEVIEW, payload : {'mode': mode, 'corpus': corpora}});
  }

  public gotoQuery(query: string, query_type: string, type_search: string) {
    this.store.dispatch({ type: GOTOQUERY, payload : [query, query_type, type_search]});
  }

  public moveTab() {
    if (this.listViewTabs[this.selectedViewTab.value] === 'Maps') {
      this.viewMap = this.listViewTabs[this.selectedViewTab.value];
      this.currentCount = this.currentCount + 1
    }
    if (this.listViewTabs[this.selectedViewTab.value] === 'Topics') {
      this.viewTopic = this.listViewTabs[this.selectedViewTab.value];
      this.currentCount = this.currentCount + 1
    }
  }
}
