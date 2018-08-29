import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BsModalService, TooltipModule } from 'ngx-bootstrap';

import { DocumentsService } from '../documents.service';
import { LocPipe } from '../loc.pipe';
import { AnnotationComponent } from './annotation.component';

describe('AnnotationComponent', () => {
  let component: AnnotationComponent;
  let fixture: ComponentFixture<AnnotationComponent>;
  let documentsServiceStub: DocumentsService;
  let bsModalServiceStub: BsModalService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports : [TooltipModule.forRoot()],
      declarations : [AnnotationComponent, LocPipe],
      providers : [
        {provide : DocumentsService, useValue : documentsServiceStub},
        {provide : BsModalService, useValue : bsModalServiceStub},
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show lemgram', () => {
    component.type = 'lemgram';
    component.data = 'snus..nn.1';
    component.translations = {'nn' : {'swe' : 'substantiv'}};
    component.ngOnInit();
    let el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('snus (substantiv)');
    expect(el.querySelector('sup')).toBeNull();

    component.data = 'snus..nn.2';
    component.ngOnInit();
    // let el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('snus2 (substantiv)');
    expect(el.querySelector('sup').textContent).toBe('2');
  });
});
