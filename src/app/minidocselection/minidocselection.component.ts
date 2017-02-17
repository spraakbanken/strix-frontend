import { Component, OnInit } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';

import { QueryService } from '../query.service';
import { OPENDOCUMENT } from '../searchreducer';
import { StrixDocument } from '../strixdocument.model';

interface AppState {
  searchRedux: any;
}

@Component({
  selector: 'minidocselection',
  templateUrl: './minidocselection.component.html',
  styleUrls: ['./minidocselection.component.css']
})
export class MinidocselectionComponent implements OnInit {

  private searchRedux: Observable<any>;

  private searchResultSubscription: Subscription;
  private documentsWithHits: StrixDocument[] = [];

  private show = false;

  constructor(private queryService: QueryService,
              private store: Store<AppState>) {
    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.filter((d) => d.latestAction === OPENDOCUMENT).subscribe((data) => {
      this.show = true;
    });


    this.searchResultSubscription = queryService.searchResult$.subscribe(
      answer => {
        console.log("answer", answer);
        this.documentsWithHits = answer.data;
        
      },
      error => null//this.errorMessage = <any>error
    );
  }

  private openDocument(docIndex: number) {
    let doc = this.documentsWithHits[docIndex];
    this.store.dispatch({type : OPENDOCUMENT, payload : doc});
  }

  ngOnInit() {
  }

}