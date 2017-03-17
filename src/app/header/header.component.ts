import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { DocumentsService } from '../documents.service';

/**
 * The header component should let the user search in the open document and as well
 * as see info about the current open document and be able to close it.
 * The component should only be visible when there is an open document.
 */

@Component({
  selector: 'header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  private subscription: Subscription;
  private documentTitle: string;

  constructor(private documentsService : DocumentsService) {

    this.subscription = documentsService.loadedDocument$.subscribe(message => {
      let openedDocument = documentsService.getDocument(message.documentIndex);
      this.documentTitle = openedDocument.title;
    });

  }

  private closeDocument() {
    this.documentsService.closeMainDocument();
    this.documentTitle = null;
  }

  ngOnInit() {
  }

}
