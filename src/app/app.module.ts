import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { AlertModule } from 'ngx-bootstrap/alert';
import { TooltipModule  } from 'ngx-bootstrap/tooltip';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { ModalModule } from 'ngx-bootstrap/modal';

import { NouisliderModule } from 'ng2-nouislider';

import { AppComponent } from './app.component';
import { DocselectionComponent } from './docselection/docselection.component';
import { DocumentsService } from './documents.service';
import { CallsService } from './calls.service';
import { CmDirective } from './reader/cm.directive';
import { CmpDirective } from './reader/cmp.directive';
import { StatDocsComponent } from './statdocs/statdocs.component';
import { CmComponent } from './reader/cm/cm.component';
import { CmpComponent } from './reader/cmp/cmp.component';
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
import { NgxBootstrapIconsModule, allIcons } from 'ngx-bootstrap-icons';
import {MatFormFieldModule} from '@angular/material/form-field';
import {A11yModule} from '@angular/cdk/a11y';
import {ClipboardModule} from '@angular/cdk/clipboard';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {PortalModule} from '@angular/cdk/portal';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {CdkStepperModule} from '@angular/cdk/stepper';
import {CdkTableModule} from '@angular/cdk/table';
import {CdkTreeModule} from '@angular/cdk/tree';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatBadgeModule} from '@angular/material/badge';
import {MatBottomSheetModule} from '@angular/material/bottom-sheet';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatChipsModule} from '@angular/material/chips';
import {MatStepperModule} from '@angular/material/stepper';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatDialogModule} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import {MatMenuModule} from '@angular/material/menu';
import {MatNativeDateModule, MatRippleModule} from '@angular/material/core';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatRadioModule} from '@angular/material/radio';
import {MatSelectModule} from '@angular/material/select';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatSliderModule} from '@angular/material/slider';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatTreeModule} from '@angular/material/tree';
import {OverlayModule} from '@angular/cdk/overlay';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { StatcolumnComponent } from './statcolumn/statcolumn.component';
import { RightcolumnComponent } from './rightcolumn/rightcolumn.component';
import { SimilarDocsComponent } from './similardocs/similardocs.component';
import { DataselectionComponent } from './dataselection/dataselection.compoment';
import { ModeselectionComponent } from './modeselection/modeselection.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { NgChartsModule } from 'ng2-charts';
import { FilterdataComponent } from './filterdata/filterdata.component';
import { DocumentStatisticComponent } from './document-statistic/document-statistic.component';
import { DocstatisticComponent } from './docstatistic/docstatistic.component';
import { CircleViewComponent } from './circleview/circleview.component';
// import { SearchFilterComponent } from './search-filter/search-filter.component';

@NgModule({
  declarations: [
    AppComponent,
    DocselectionComponent,
    CmDirective,
    CmpDirective,
    StatDocsComponent,
    CmComponent,
    CmpComponent,
    ReaderComponent,
    LemgramPipeStub,
    LemgramPipe,
    LeftcolumnComponent,
    StatcolumnComponent,
    RightcolumnComponent,
    SimilarDocsComponent,
    DataselectionComponent,
    ModeselectionComponent,
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
    FilterdataComponent,
    DocumentStatisticComponent,
    DocstatisticComponent,
    CircleViewComponent,
    // SearchFilterComponent
  ],
  imports: [
    MatAutocompleteModule,
    MatBadgeModule,
    MatBottomSheetModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatStepperModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatGridListModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatRippleModule,
    MatSelectModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatTreeModule,
    OverlayModule,
    PortalModule,
    ScrollingModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    CdkTreeModule,
    BrowserAnimationsModule,
    MatIconModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    NgxSliderModule,
    // RouterModule.forRoot([]),
    TypeaheadModule.forRoot(),
    BsDropdownModule.forRoot(),
    AlertModule.forRoot(),
    PaginationModule.forRoot(),
    AccordionModule.forRoot(),
    TooltipModule.forRoot(),
    ModalModule.forRoot(),
    StoreModule.forRoot({searchRedux: searchReducer}),
    NouisliderModule,
    NgxBootstrapIconsModule.pick(allIcons),
    PopoverModule.forRoot(),
    NgChartsModule
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
    return new Promise<boolean>((resolve, reject) => {
      callsService.testForLogin().subscribe(
        answer => {
          console.log("Login", answer);
          resolve(true);
        },
        error => { resolve(false); }
      );
    });
  };
}
