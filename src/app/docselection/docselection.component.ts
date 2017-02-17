import { Component, OnInit, Input } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';

import { QueryService } from '../query.service';
import { DocumentsService } from '../documents.service';
import { MetadataService } from '../metadata.service';
import { StrixDocument } from '../strixdocument.model';
import { StrixEvent } from '../strix-event.enum';
import { OPENDOCUMENT } from '../searchreducer';

interface AppState {
  searchRedux: any;
}

@Component({
  selector: 'docselection',
  templateUrl: './docselection.component.html',
  styleUrls: ['./docselection.component.css']
})
export class DocselectionComponent implements OnInit {

  private searchRedux: Observable<any>;

  private hasSearched = false;
  
  private currentPaginatorPage: number = 1; // Needs to be 1-based because of the paginator widget

  private documentsWithHits: StrixDocument[] = [];//StrixDocHit[] = [];
  private totalNumberOfDocuments: number = 0;

  private textAttributes: any[] = [];

  private availableCorpora: string[] = [];
  private checkedCorpora: any = {};

  private show = true;

  private searchResultSubscription: Subscription;

  constructor(private documentsService: DocumentsService,
              private queryService: QueryService,
              private metadataService: MetadataService,
              private store: Store<AppState>) {
    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.filter((d) => d.latestAction === OPENDOCUMENT).subscribe((data) => {
      this.show = false;
    });

    this.searchResultSubscription = queryService.searchResult$.subscribe(
      answer => {
        console.log("answer", answer);
        /*let docs = [];
        if (answer.count > 0) {
          for (let document of answer.data) {
            let doc = new StrixDocHit();
            doc.corpusID = document.corpus;
            doc.documentID = document.es_id;
            doc.documentTitle = document.title || "-no title-";
            doc.collectionTitle = document.corpus; // TODO: Either get the translated title or use corpusID instead
            //doc.noOfHits = document.highlight.length;
            doc.textAttributes = document.text_attributes;
            // The bellow should be done in the documents service!
            if (document.highlight && document.highlight.highlight) { // In case there is only a hit in the title...
              doc.highlights = _.map(document.highlight.highlight, (hit, index) => {
                return hit;
              });
            } else {
              doc.highlights = [];
            }
            docs.push(doc);
          }
        }*/
        this.documentsWithHits = answer.data;
        this.totalNumberOfDocuments = answer.count;
        this.hasSearched = true;
      },
      error => null//this.errorMessage = <any>error
    );

  }

  ngOnInit() {}

  

  private paginatorPageChanged(event: any) {
    console.log("Changed paginator page", event);
    this.queryService.setPage(event.page); // Should probably be a dispatch to the store
    //this.simpleSearch(true);
  }

  private openDocument(docIndex: number) {
    let doc = this.documentsWithHits[docIndex];
    this.store.dispatch({type : OPENDOCUMENT, payload : doc});
  }
  private openDocumentInNew(docIndex: number) {
    let doc = this.documentsWithHits[docIndex];
    //this.documentsService.loadDocumentWithQuery(doc.doc_id, doc.corpusID, doc.highlights, this.queryService.getSearchString(), true);
  }

  private displayCorpusInfo(docIndex: number) {
    let doc = this.documentsWithHits[docIndex];
    this.textAttributes = _.map(doc.textAttributes, (item, key) => {
      return {"key" : key, "value" : item};
    });
  }

}