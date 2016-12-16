//import { Component, AfterViewInit, ViewChild } from '@angular/core';
//import { Component, AfterViewInit, ViewChildren, QueryList } from '@angular/core';
import * as _ from 'lodash';
//import { StrixDocument } from './strixdocument.model';
//import { StrixSelection } from './strixselection.model';
//import { DocumentsService } from './documents.service';
//import { CmComponent } from './cm/cm.component';
//import { Subscription }   from 'rxjs/Subscription';
import { Component } from '@angular/core';
//import { ReaderComponent } from './reader/reader.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  
  constructor() {
    console.log(_.add(1, 3));
  }

}
