import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { DocumentsService } from '../documents.service';
import { OPENDOCUMENT, CHANGEPAGE, RELOAD, SEARCH } from '../searchreducer';
import { StrixDocument } from '../strixdocument.model';

interface AppState {
  searchRedux: any;
}

@Component({
  selector: 'minidocselection',
  templateUrl: './minidocselection.component.html',
  styleUrls: ['./minidocselection.component.css']
})
export class MinidocselectionComponent implements OnInit, OnDestroy {

  private searchRedux: Observable<any>;

  private subscription: Subscription;

  private searchResultSubscription: Subscription;
  private documentsWithHits: StrixDocument[] = [];
  private totalNumberOfDocuments: number = 0;
  private page = 1;

  //private isLoading = false;
  private show = false;

  constructor(private queryService: QueryService,
              private store: Store<AppState>,
              private documentsService: DocumentsService) {
    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.filter((d) => d.latestAction === OPENDOCUMENT).subscribe((data) => {
      this.show = true;
      this.page = data.page;
    });
    this.searchRedux.filter((d) => d.latestAction === SEARCH || d.latestAction === RELOAD).subscribe((data) => {
      console.log("searched or changed page")
      this.documentsWithHits = [];
      this.page = data.page;
    });

    this.subscription = documentsService.loadedDocument$.subscribe(
      message => {
        console.log("fetching related data.", message);
        documentsService.getRelatedDocuments(message.documentIndex).subscribe(
          answer => {
            console.log("related data", answer["data"]);
            this.documentsWithHits = answer["data"];
          }
        );
    });

    /* this.searchResultSubscription = queryService.searchResult$.subscribe(
      answer => {
        console.log("answer", answer);
        this.documentsWithHits = answer.data;
        this.totalNumberOfDocuments = answer.count;
        //this.isLoading = false;
      },
      error => null//this.errorMessage = <any>error
    ); */
  }

  private openDocument(docIndex: number) {
    let doc = this.documentsWithHits[docIndex];
    this.store.dispatch({type : OPENDOCUMENT, payload : doc});
  }

  private previousPage() {
    this.store.dispatch({type : CHANGEPAGE, payload : this.page - 1});
    this.store.dispatch({type : RELOAD, payload : null});
    console.log("Dispatched CHANGEPAGE to", this.page - 1);
  }

  private nextPage() {
    this.store.dispatch({type : CHANGEPAGE, payload : this.page + 1});
    this.store.dispatch({type : RELOAD, payload : null});
    console.log("Dispatched CHANGEPAGE to", this.page + 1);
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}