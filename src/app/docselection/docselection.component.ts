import { Component, OnInit } from '@angular/core';
import { Router, RoutesRecognized } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';

import { StrixDocument } from '../strixdocument.model';
import { DocumentsService } from '../documents.service';
import { CallsService } from '../calls.service';
import { KarpService } from '../karp.service';
import { QueryService } from '../query.service';
import { MetadataService } from '../metadata.service';
import { SEARCH, CHANGENEXTQUERY } from '../searchreducer';
import { StrixEvent } from '../strix-event.enum';

interface AppState {
  searchRedux: any;
}

@Component({
  selector: 'docselection',
  templateUrl: './docselection.component.html',
  styleUrls: ['./docselection.component.css']
})
export class DocselectionComponent implements OnInit {

  //private queryChangeSubscription: Subscription;

  private errorMessage: string;
  private dataSource: Observable<any>;

  private searchableAnnotations: string[] = ["lemgram", "betydelse"];
  private searchType = "normal"; // TODO: Have something else than the string
  private hasSearched = false;
  private isSearching = false;
  private currentPaginatorPage : number = 1; // Needs to be 1-based because of the paginator widget

  private asyncSelected: string = "";
  private documentsWithHits: DocHit[] = [];
  private totalNumberOfDocuments: number = 0;

  private textAttributes: any[] = [];

  private availableCorpora: string[] = [];
  private checkedCorpora: any = {};

  private searchRedux: Observable<any>;

  private searchResultSubscription: Subscription;

  private searchStatusSubscription: Subscription;

  constructor(private documentsService: DocumentsService,
              private callsService: CallsService,
              private karpService: KarpService,
              private queryService: QueryService,
              private metadataService: MetadataService,
              private router: Router,
              private store: Store<AppState>) {
    
    this.searchRedux = this.store.select('searchRedux');

    this.searchResultSubscription = queryService.searchResult$.subscribe(
      answer => {
        console.log("answer", answer);
        let docs = [];
        if (answer.count > 0) {
          for (let document of answer.data) {
            let doc = new DocHit();
            doc.corpusID = document.corpus;
            doc.documentID = document.es_id;
            doc.documentTitle = document.title || "-no title-";
            doc.collectionTitle = document.corpus; // TODO: Either get the translated title or use corpusID instead
            //doc.noOfHits = document.highlight.length;
            doc.textAttributes = document.text_attributes;
            if (document.highlight && document.highlight.highlight) { // In case there is only a hit in the title...
              doc.highlights = _.map(document.highlight.highlight, (hit, index) => {
                return hit;
              });
            } else {
              doc.highlights = [];
            }
            docs.push(doc);
          }
        }
        this.documentsWithHits = docs;
        this.totalNumberOfDocuments = answer.count;
        //this.isSearching = false;
        this.hasSearched = true;
      },
      error => this.errorMessage = <any>error
    );

    this.searchStatusSubscription = queryService.searchStatus$.subscribe(
      answer => {
        console.log("search status:", answer);
        switch (answer) { // TODO: Create an enum for this. Or a union type?
          case StrixEvent.SEARCHSTART:
            this.isSearching = true;
            break;
          case StrixEvent.SEARCHEND:
            this.isSearching = false;
            break;
        }
      },
      error => this.errorMessage = <any>error
    );

    this.dataSource = Observable.create((observer:any) => {
      // Runs on every autocompletion search
      console.log("-----");
      observer.next(this.asyncSelected);
    }).mergeMap((token: string) => this.karpService.lemgramsFromWordform(this.asyncSelected));

  }

  ngOnInit() {
    //console.log("this.activatedRoute", this.route);
    //this.route.params.subscribe((something) => {
    //  console.log("something happended with the route!", something);
    //});

    this.router.events.subscribe((data) => {
      if (data instanceof RoutesRecognized) {
        console.log("routes recognized", data.state);
      }
    });
  }

  /* This should read from the current query (in the query-service)
     and update this component's GUI accordingly. */
  private updateGUIFromCurrentQuery() {
    this.asyncSelected = this.queryService.getSearchString();
  }

  private paginatorPageChanged(event: any) {
    console.log("Changed paginator page", event);
    this.queryService.setPage(event.page);
    this.simpleSearch(true);
  }

  private typeaheadOnSelect(event) {
    console.log("Selected something with the event", event);
  }

  public toggled(open: boolean): void {
    console.log('Dropdown is now: ', open);
  }

  private simpleSearch(fromPaginator: boolean) {
    this.store.dispatch({ type: CHANGENEXTQUERY, payload : this.asyncSelected});
    this.store.dispatch({ type: SEARCH, payload : null});

    //this.isSearching = true; // This should be dealt with differently
  }

  private openDocument(docIndex: number) {
    let doc = this.documentsWithHits[docIndex];
    this.documentsService.loadDocumentWithQuery(doc.documentID, doc.corpusID, doc.highlights, this.queryService.getSearchString());
  }
  private openDocumentInNew(docIndex: number) {
    let doc = this.documentsWithHits[docIndex];
    this.documentsService.loadDocumentWithQuery(doc.documentID, doc.corpusID, doc.highlights, this.queryService.getSearchString(), true);
  }

  private displayCorpusInfo(docIndex: number) {
    let doc = this.documentsWithHits[docIndex];
    this.textAttributes = _.map(doc.textAttributes, (item, key) => {
      return {"key" : key, "value" : item};
    });
  }

}

class DocHit {
  documentTitle : string;
  collectionTitle: string;
  textAttributes: any;
  highlights: any;
  noOfHits: number;
  documentID : string; // Don't show this in the GUI
  corpusID : string; // Don't show this in the GUI
}