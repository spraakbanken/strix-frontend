/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AppState } from '../searchreducer';
import { StartPanelComponent } from './start-panel.component';

describe('StartPanelComponent', () => {
  let component: StartPanelComponent;
  let fixture: ComponentFixture<StartPanelComponent>;
  let appStateStore: Store<AppState>;

  beforeEach(async(() => {
    appStateStore = <Store<AppState>>{
      select : a => new Observable(),
    };

    TestBed.configureTestingModule({
      declarations: [StartPanelComponent],
      providers: [
        {provide : Store, useValue : appStateStore},
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StartPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
