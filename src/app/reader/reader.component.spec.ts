/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockComponent } from 'ng2-mock-component';
import { Observable } from 'rxjs/Observable';
import { DocumentsService } from '../documents.service';
import { EnsurearrayPipe } from '../ensurearray.pipe';
import { MetadataService } from '../metadata.service';
import { LocPipeStub } from '../mocks/loc-stub.pipe';
import { ReaderCommunicationService } from '../reader-communication.service';
import { AppState } from '../searchreducer';

import { ReaderComponent } from './reader.component';

describe('ReaderComponent', () => {
  let component: ReaderComponent;
  let fixture: ComponentFixture<ReaderComponent>;
  let documentsService: DocumentsService;
  let appStateStore: Store<AppState>;
  let metadataService: MetadataService;
  let readerCommunicationService: ReaderCommunicationService;

  function noop() {}

  beforeEach(async(() => {
    documentsService = <DocumentsService>{
      tokenInfoDone$ : new Observable(noop),
      docLoadingStatus$ : new Observable(noop),
      loadedDocument$ : new Observable(noop),
    };

    metadataService = <MetadataService>{
      loadedMetadata$ : new Observable(noop),
    };

    appStateStore = <Store<AppState>>{
      select : a => ({
        filter : predicate => new Observable(noop),
      }),
    };

    readerCommunicationService = <ReaderCommunicationService>{
      event$: new Observable(noop),
    };

    TestBed.configureTestingModule({
      declarations : [ReaderComponent, LocPipeStub, EnsurearrayPipe,
        MockComponent({selector : 'cm', inputs : ['index']}),
        MockComponent({selector : 'accordion', inputs : ['closeOthers']}),
        MockComponent({selector : 'accordion-group', inputs : ['isOpen', 'heading']}),
        MockComponent({selector : 'annotation', inputs : ['data', 'type', 'translations']}),
      ],
      providers : [
        {provide : DocumentsService, useValue : documentsService},
        {provide : Store, useValue : appStateStore},
        {provide : MetadataService, useValue : metadataService},
        {provide : ReaderCommunicationService, useValue : readerCommunicationService},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
