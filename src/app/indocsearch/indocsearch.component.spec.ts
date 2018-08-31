/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TypeaheadModule } from 'ngx-bootstrap';

import { LocPipeStub } from '../mocks/loc-stub.pipe';
import { AppState } from '../searchreducer';
import { IndocsearchComponent } from './indocsearch.component';

describe('IndocsearchComponent', () => {
  let component: IndocsearchComponent;
  let fixture: ComponentFixture<IndocsearchComponent>;

  const appStateStore = <Store<AppState>>{};

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports : [FormsModule, TypeaheadModule],
      declarations : [IndocsearchComponent, LocPipeStub],
      providers : [
        {provide : Store, useValue : appStateStore},
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IndocsearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
