import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { TypeaheadModule,
         DropdownModule,
         AlertModule,
         PaginationModule } from 'ng2-bootstrap/ng2-bootstrap';

import { AppComponent } from './app.component';
import { DocselectionComponent } from './docselection/docselection.component';
import { DocumentsService } from './documents.service';
import { CallsService } from './calls.service';
import { CmDirective } from './reader/cm.directive';
import { CmComponent } from './reader/cm/cm.component';
import { ReaderComponent } from './reader/reader.component';
import { KarpService } from './karp.service';
import { LemgramPipe } from './lemgram.pipe';
import { LeftcolumnComponent } from './leftcolumn/leftcolumn.component';
import { QueryService } from './query.service';
import { MetadataService } from './metadata.service';
import { StartPanelComponent } from './start-panel/start-panel.component';
import { searchReducer } from './searchreducer';
import { RoutingService } from './routing.service';
import { SearchComponent } from './search/search.component';
import { MinidocselectionComponent } from './minidocselection/minidocselection.component';

@NgModule({
  declarations: [
    AppComponent,
    DocselectionComponent,
    CmDirective,
    CmComponent,
    ReaderComponent,
    LemgramPipe,
    LeftcolumnComponent,
    StartPanelComponent,
    SearchComponent,
    MinidocselectionComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    TypeaheadModule,
    DropdownModule,
    AlertModule,
    PaginationModule,
    StoreModule.provideStore({searchRedux: searchReducer})
  ],
  providers: [DocumentsService,
              CallsService,
              KarpService,
              QueryService,
              MetadataService,
              RoutingService],
  bootstrap: [AppComponent]
})
export class AppModule { }
