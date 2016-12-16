import { Component, OnInit } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';

import { StrixDocument } from '../strixdocument.model';
import { DocumentsService } from '../documents.service';
import { CallsService } from '../calls.service';
import { KarpService } from '../karp.service';
import { QueryService } from '../query.service';
import { MetadataService } from '../metadata.service';

@Component({
  selector: 'docselection',
  templateUrl: './docselection.component.html',
  styleUrls: ['./docselection.component.css']
})
export class DocselectionComponent implements OnInit {

  private queryChangeSubscription: Subscription;

  private errorMessage: string;
  private dataSource: Observable<any>;

  private searchableAnnotations: string[] = ["lemgram", "betydelse"];
  private searchType = "textsträng"; // TODO: Have something else than the string
  private hasSearched: boolean = false;
  private isSearching: boolean = false;
  private currentPaginatorPage : number = 1; // Needs to be 1-based because of the paginator widget

  private simpleSearchString: string = "";
  private asyncSelected: string = "";
  private documentsWithHits: DocHit[] = [];
  private totalNumberOfDocuments: number = 0;

  private textAttributes: any[] = [];

  private availableCorpora: string[] = [];
  private checkedCorpora: any = {};

  constructor(private documentsService: DocumentsService,
              private callsService: CallsService,
              private karpService: KarpService,
              private queryService: QueryService,
              private metadataService: MetadataService) {

    this.queryChangeSubscription = queryService.queryChanged$.subscribe(
      query => {
        console.log("query changed!");
        this.updateGUIFromCurrentQuery();
        this.simple_search(false);
    });

    this.dataSource = Observable.create((observer:any) => {
      // Runs on every search
      observer.next(this.asyncSelected);
    }).mergeMap((token: string) => this.karpService.lemgramsFromWordform(this.asyncSelected));

  }

  ngOnInit() {}

  /* This should read from the current query (in the query-service)
     and update this component's GUI accordingly. */
  private updateGUIFromCurrentQuery() {
    this.asyncSelected = this.queryService.getSearchString();
  }

  private paginatorPageChanged(event: any) {
    console.log("Changed paginator page", event);
    this.queryService.setPage(event.page);
    this.simple_search(true);
  }

  private typeaheadOnSelect(event) {
    console.log("Selected something with the event", event);
  }

  public toggled(open: boolean): void {
    console.log('Dropdown is now: ', open);
  }

  private simple_search(fromPaginator: boolean) {
    if (!fromPaginator) {
      this.queryService.setPage(1);
    }
    this.isSearching = true;
    this.queryService.setSearchString(this.asyncSelected);
      this.queryService.runCurrentQuery().subscribe(
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
              //console.log("doc.highlight", document.highlight);
              if (document.highlight && document.highlight.highlight) { // In case there is only a hit in the title...
                doc.highlights = _.map(document.highlight.highlight, (hit, index) => {
                  return hit;
                  /*let lcstring = _.map(hit["left_context"], "word").join(" ");
                  let matchstring = _.map(hit["match"], "word").join(" ");
                  let rcstring = _.map(hit["right_context"], "word").join(" ");
                  return {
                    "before" : lcstring,
                    "match" : matchstring,
                    "after" : rcstring
                  } */
                });
              } else {
                doc.highlights = [];
              }
              docs.push(doc);
            }
          }
          this.documentsWithHits = docs;
          this.totalNumberOfDocuments = answer.count;
          this.isSearching = false;
          this.hasSearched = true;
        },
        error => this.errorMessage = <any>error
      );
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