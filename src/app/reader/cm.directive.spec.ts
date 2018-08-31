/* tslint:disable:no-unused-variable */

import { Component, ElementRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CmDirective } from './cm.directive';

describe('Directive: Cm', () => {
  let component: HostComponent;
  let fixture: ComponentFixture<HostComponent>;
  let elementRef: ElementRef;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations : [HostComponent],
    })
      .compileComponents()
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(component).toBeTruthy();
  });
});

@Component({
  template : '<textarea cm></textarea>',
})
class HostComponent {}
