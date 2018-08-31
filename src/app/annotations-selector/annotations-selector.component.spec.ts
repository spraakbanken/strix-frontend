import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MockComponent } from 'ng2-mock-component';
import { TypeaheadModule } from 'ngx-bootstrap';

import { CallsService } from '../calls.service';
import { DocumentsService } from '../documents.service';
import { LocService } from '../loc.service';
import { MetadataService } from '../metadata.service';
import { LocPipeStub } from '../mocks/loc-stub.pipe';
import { PrettynumberPipeStub } from '../mocks/prettynumber-stub.pipe';
import { ReaderCommunicationService } from '../reader-communication.service';
import { AppState } from '../searchreducer';
import { AnnotationsSelectorComponent } from './annotations-selector.component';

describe('AnnotationsSelectorComponent', () => {
  let component: AnnotationsSelectorComponent;
  let fixture: ComponentFixture<AnnotationsSelectorComponent>;

  const documentsService = <DocumentsService>{};
  const metadataService = <MetadataService>{};
  const callsService = <CallsService>{};
  const readerCommunicationService = <ReaderCommunicationService>{};
  const locService = <LocService>{};
  const appStateStore = <Store<AppState>>{};

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports : [FormsModule, TypeaheadModule],
      declarations : [AnnotationsSelectorComponent, LocPipeStub, PrettynumberPipeStub,
        MockComponent({selector : 'minidocselection'}),
        MockComponent({selector : 'multicomplete', inputs : ['locConf', 'buckets']}),
        MockComponent({selector : 'rangeslider', inputs : ['min', 'max', 'value']}),
        MockComponent({selector : 'annotation', inputs : ['type', 'data', 'translations', 'noKarp']}),
      ],
      providers : [
        {provide : DocumentsService, useValue : documentsService},
        {provide : MetadataService, useValue : metadataService},
        {provide : CallsService, useValue : callsService},
        {provide : ReaderCommunicationService, useValue : readerCommunicationService},
        {provide : LocService, useValue : locService},
        {provide : Store, useValue : appStateStore},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnotationsSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
