/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentsService } from '../../documents.service';
import { CmComponent } from './cm.component';

describe('CmComponent', () => {
  let component: CmComponent;
  let fixture: ComponentFixture<CmComponent>;

  const documentsService = <DocumentsService>{};

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CmComponent],
      providers: [
        {provide : DocumentsService, useValue : documentsService},
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
