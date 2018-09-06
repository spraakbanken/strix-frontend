/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { MockComponent } from 'ng2-mock-component';
import { Observable } from 'rxjs';

import { DocumentsService } from '../documents.service';
import { MetadataService } from '../metadata.service';
import { LocPipeStub } from '../mocks/loc-stub.pipe';
import { PrettynumberPipeStub } from '../mocks/prettynumber-stub.pipe';
import { QueryService } from '../query.service';
import { queryStateReducer, documentStateReducer, uiStateReducer } from '../searchreducer';
import { DocselectionComponent } from './docselection.component';

describe('DocselectionComponent', () => {
  let component: DocselectionComponent;
  let fixture: ComponentFixture<DocselectionComponent>;

  const documentsService = <DocumentsService>{};
  const queryService = <QueryService>{
    searchResult$ : new Observable(),
  };
  const metadataService = <MetadataService>{
    loadedMetadata$ : new Observable(),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports : [
        FormsModule,
        StoreModule.forRoot({query : queryStateReducer, document : documentStateReducer, ui : uiStateReducer}),
      ],
      declarations : [DocselectionComponent, LocPipeStub, PrettynumberPipeStub,
        MockComponent({selector : 'alert', inputs : ['type', 'dismissible']}),
        MockComponent({selector : 'pagination',
          inputs : ['totalItems', 'itemsPerPage', 'maxSize', 'pageChanged', 'previousText', 'nextText']}),
      ],
      providers : [
        {provide : DocumentsService, useValue : documentsService},
        {provide : QueryService, useValue : queryService},
        {provide : MetadataService, useValue : metadataService},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocselectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
