/* tslint:disable:no-unused-variable */

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockComponent } from 'ng2-mock-component';
import { Observable } from 'rxjs/Observable';
import { AppComponent } from './app.component';
import { LocService } from './loc.service';
import { LocPipeStub } from './mocks/loc-stub.pipe';
import { RoutingService } from './routing.service';
import { AppState } from './searchreducer';

describe('App: Strix', () => {
  let app: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let el: HTMLElement;

  const routingService = <RoutingService>{};
  const locService = <LocService>{};
  const appStateStore = <Store<AppState>>{
    select : a => ({
      filter : predicate => new Observable(noop),
    }),
  };

  function noop() {}

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations : [AppComponent, LocPipeStub
        MockComponent({selector : 'leftcolumn'}),
        MockComponent({selector : 'search'}),
        MockComponent({selector : 'docselection'}),
        MockComponent({selector : 'indocsearch'}),
        MockComponent({selector : 'header'}),
        MockComponent({selector : 'reader'}),
      ],
      providers : [
        {provide : RoutingService, useValue : routingService},
        {provide : LocService, useValue : locService},
        {provide : Store, useValue : appStateStore},
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('should create the app', async(() => {
    expect(app).toBeTruthy();
  }));

});
