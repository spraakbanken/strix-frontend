/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockComponent } from 'ng2-mock-component';
import { Observable } from 'rxjs';

import { MetadataService } from '../metadata.service';
import { PrettynumberPipeStub } from '../mocks/prettynumber-stub.pipe';
import { QueryService } from '../query.service';
import { AppState } from '../searchreducer';
import { LeftcolumnComponent } from './leftcolumn.component';
import { LocPipeStub } from '../mocks/loc-stub.pipe';

describe('LeftcolumnComponent', () => {
  let component: LeftcolumnComponent;
  let fixture: ComponentFixture<LeftcolumnComponent>;

  const metadataService = <MetadataService>{
    loadedMetadata$ : new Observable(),
  };
  const queryService = <QueryService>{
    aggregationResult$ : new Observable(),
  };
  const appStateStore = <Store<AppState>>{
    select : a => new Observable(),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations : [LeftcolumnComponent,
        MockComponent({'selector' : 'minidocselection'}),
        MockComponent({'selector' : 'multicomplete', 'inputs' : ['locConf', 'buckets']}),
        MockComponent({'selector' : 'rangeslider', 'inputs' : ['min', 'max', 'value']}),
        LocPipeStub, PrettynumberPipeStub],
      providers : [
        {provide : MetadataService, useValue : metadataService},
        {provide : QueryService, useValue : queryService},
        {provide : Store, useValue : appStateStore},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeftcolumnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
