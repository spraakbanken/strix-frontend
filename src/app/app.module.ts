import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { TypeaheadModule,
         BsDropdownModule,
         AlertModule,
         PaginationModule,
         AccordionModule,
         TooltipModule,
         ModalModule } from 'ngx-bootstrap';

import { NouisliderModule } from 'ng2-nouislider';

import { AppComponent } from './app.component';
import { DocselectionComponent } from './docselection/docselection.component';
import { DocumentsService } from './documents.service';
import { CallsService } from './calls.service';
import { CmDirective } from './reader/cm.directive';
import { CmComponent } from './reader/cm/cm.component';
import { ReaderComponent } from './reader/reader.component';
import { KarpService } from './karp.service';
import { LemgramPipe } from './lemgram.pipe';
import { LemgramPipeStub } from './mocks/lemgram-stub.pipe';
import { LeftcolumnComponent } from './leftcolumn/leftcolumn.component';
import { MultiCompleteComponent } from './leftcolumn/multicomplete/multicomplete.component';
import { RangesliderComponent } from './leftcolumn/rangeslider.component';
import { QueryService } from './query.service';
import { MetadataService } from './metadata.service';
import { StartPanelComponent } from './start-panel/start-panel.component';
import { searchReducer } from './searchreducer';
import { RoutingService } from './routing.service';
import { SearchComponent } from './search/search.component';
import { MinidocselectionComponent } from './minidocselection/minidocselection.component';
import { HeaderComponent } from './header/header.component';
import { LocService } from './loc.service';
import { LocPipe } from './loc.pipe';
import { LocPipeStub } from './mocks/loc-stub.pipe';
import { IndocsearchComponent } from './indocsearch/indocsearch.component';
import { HistogramComponent } from './histogram/histogram.component';
import { AnnotationsSelectorComponent } from './annotations-selector/annotations-selector.component';
import { ReaderCommunicationService } from './reader-communication.service';
import { AnnotationComponent } from './annotation/annotation.component';
import { PrettynumberPipe } from './prettynumber.pipe';
import { PrettynumberPipeStub } from './mocks/prettynumber-stub.pipe';
import { EnsurearrayPipe } from './ensurearray.pipe';
// import { SearchFilterComponent } from './search-filter/search-filter.component';

@NgModule({
  declarations: [
    AppComponent,
    DocselectionComponent,
    CmDirective,
    CmComponent,
    ReaderComponent,
    LemgramPipeStub,
    LemgramPipe,
    LeftcolumnComponent,
    MultiCompleteComponent,
    StartPanelComponent,
    SearchComponent,
    MinidocselectionComponent,
    HeaderComponent,
    LocPipeStub,
    LocPipe,
    IndocsearchComponent,
    HistogramComponent,
    AnnotationsSelectorComponent,
    AnnotationComponent,
    PrettynumberPipeStub,
    PrettynumberPipe,
    EnsurearrayPipe,
    RangesliderComponent,
    // SearchFilterComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    // RouterModule.forRoot([]),
    TypeaheadModule.forRoot(),
    BsDropdownModule.forRoot(),
    AlertModule.forRoot(),
    PaginationModule.forRoot(),
    AccordionModule.forRoot(),
    TooltipModule.forRoot(),
    ModalModule.forRoot(),
    StoreModule.forRoot({searchRedux: searchReducer}),
    NouisliderModule
  ],
  providers: [
              CallsService,
              {
                provide: APP_INITIALIZER,
                useFactory: onAppInit,
                multi: true,
                deps: [CallsService]
              },
              DocumentsService,
              KarpService,
              QueryService,
              MetadataService,
              RoutingService,
              LocService,
              ReaderCommunicationService],
  bootstrap: [AppComponent]
})
export class AppModule { }

export function onAppInit(callsService: CallsService): () => Promise<any> {
  return (): Promise<any> => {
    return new Promise((resolve, reject) => {
      callsService.testForLogin().subscribe(
        answer => {
          console.log("Login", answer);
          resolve();
        },
        error => { resolve(); }
      );
    });
  };
}
