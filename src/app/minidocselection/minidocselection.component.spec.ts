/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { DocumentsService } from '../documents.service';
import { LocPipeStub } from '../mocks/loc-stub.pipe';
import { QueryService } from '../query.service';
import { AppState } from '../searchreducer';
import { MinidocselectionComponent } from './minidocselection.component';

describe('MinidocselectionComponent', () => {
  let component: MinidocselectionComponent;
  let fixture: ComponentFixture<MinidocselectionComponent>;
  let queryServiceStub: QueryService;
  let appStateStore: Store<AppState>;
  let documentsServiceStub: DocumentsService;

  beforeEach(async(() => {
    appStateStore = <Store<AppState>>{
      select : a => new Observable(),
    };
    documentsServiceStub = <DocumentsService>{
      loadedDocument$ : new Observable(),
    };

    TestBed.configureTestingModule({
      declarations: [MinidocselectionComponent, LocPipeStub],
      providers : [
        {provide : QueryService, useValue : queryServiceStub},
        {provide : Store, useValue : appStateStore},
        {provide : DocumentsService, useValue : documentsServiceStub},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MinidocselectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
