import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationsSelectorComponent } from './annotations-selector.component';

describe('AnnotationsSelectorComponent', () => {
  let component: AnnotationsSelectorComponent;
  let fixture: ComponentFixture<AnnotationsSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnnotationsSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnotationsSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
