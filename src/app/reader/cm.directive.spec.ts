/* tslint:disable:no-unused-variable */

import { CmDirective } from './cm.directive';
import { ElementRef } from '@angular/core';

describe('Directive: Cm', () => {
  let elementRef: ElementRef;

  beforeEach(() => {
    elementRef = jasmine.createSpyObj('ElementRef', []);
  });

  it('should create an instance', () => {
    let directive = new CmDirective(elementRef);
    expect(directive).toBeTruthy();
  });
});
