/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TypeaheadModule } from 'ngx-bootstrap';
import { Observable } from 'rxjs/Observable';

import { CallsService } from '../calls.service';
import { KarpService } from '../karp.service';
import { LemgramPipeStub } from '../mocks/lemgram-stub.pipe';
import { LocPipeStub } from '../mocks/loc-stub.pipe';
import { QueryService } from '../query.service';
import { AppState } from '../searchreducer';
import { SearchComponent } from './search.component';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  const callsService = <CallsService>{};
  const karpService = <KarpService>{};
  const queryService = <QueryService>{
    searchStatus$ : new Observable(noop),
  };
  const appStateStore = <Store<AppState>>{
    select : a => new Observable(noop),
  };

  function noop() {}

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports : [FormsModule, TypeaheadModule],
      declarations : [SearchComponent, LocPipeStub, LemgramPipeStub],
      providers : [
        {provide : CallsService, useValue : callsService},
        {provide : KarpService, useValue : karpService},
        {provide : QueryService, useValue : queryService},
        {provide : Store, useValue : appStateStore},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
