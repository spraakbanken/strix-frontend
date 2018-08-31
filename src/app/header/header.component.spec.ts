/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponent } from 'ng2-mock-component';

import { DocumentsService } from '../documents.service';
import { MetadataService } from '../metadata.service';
import { LocPipeStub } from '../mocks/loc-stub.pipe';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let documentsServiceStub: DocumentsService;
  let metadataServiceStub: MetadataService;
  let el: HTMLElement;
  let documentsServiceLoadedDocumentsSubscribeNext;

  beforeEach(async(() => {
    documentsServiceStub = <DocumentsService>{
      loadedDocument$ : {
        subscribe : next => {
          documentsServiceLoadedDocumentsSubscribeNext = next;
        }
      }
    };

    TestBed.configureTestingModule({
      declarations : [HeaderComponent, MockComponent({'selector' : 'annotations-selector'}), LocPipeStub],
      providers : [
        {provide : DocumentsService, useValue : documentsServiceStub},
        {provide : MetadataService, useValue : metadataServiceStub},
      ]

    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  it('should show document title', () => {
    component.corpusName = {'swe': 'Fin samling', 'eng' : 'Nice collection'};
    component.documentTitle = 'A fantastic document';
    fixture.detectChanges();
    expect(el.textContent).toContain('Fin samling');
    expect(el.textContent).not.toContain('Nice collection');
    expect(el.textContent).toContain('A fantastic document');
  });
});
