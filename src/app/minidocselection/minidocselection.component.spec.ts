/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { MinidocselectionComponent } from './minidocselection.component';

describe('MinidocselectionComponent', () => {
  let component: MinidocselectionComponent;
  let fixture: ComponentFixture<MinidocselectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MinidocselectionComponent ]
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
