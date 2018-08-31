import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BsModalService, TooltipModule } from 'ngx-bootstrap';

import { DocumentsService } from '../documents.service';
import { LocPipeStub } from '../mocks/loc-stub.pipe';
import { AnnotationComponent } from './annotation.component';

describe('AnnotationComponent', () => {
  let component: AnnotationComponent;
  let fixture: ComponentFixture<AnnotationComponent>;
  let documentsServiceStub: DocumentsService;
  let bsModalServiceStub: BsModalService;
  let el: HTMLElement;

  beforeEach(async(() => {

    TestBed.configureTestingModule({
      imports : [TooltipModule.forRoot()],
      declarations : [AnnotationComponent, LocPipeStub],
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
    el = fixture.nativeElement;
  });

  describe('Normal annotation types', () => {
    it('nontranslatable', () => {
      component.type = 'pos';
      component.data = 'substantiv';
      component.ngOnInit();
      fixture.detectChanges();
      expect(el.textContent).toContain('substantiv');
    });

    it('translatable', () => {
      component.type = 'pos';
      component.data = 'nn';
      component.translations = {'nn' : {'swe' : 'substantiv'}};
      component.ngOnInit();
      fixture.detectChanges();
      expect(el.textContent).toContain('substantiv');
    });

    it('with confidence', () => {
      component.type = 'pos';
      component.data = 'substantiv:0.6';
      component.ngOnInit();
      fixture.detectChanges();
      expect(el.textContent).toContain('substantiv');
      expect(el.innerHTML).toContain('tooltip="0.6"');
    });
  });

  it('lemgram', () => {
    component.type = 'lemgram';
    component.data = 'snus..nn.1';
    component.translations = {'nn' : {'swe' : 'substantiv'}};
    component.ngOnInit();
    fixture.detectChanges();
    expect(el.textContent).toContain('snus1');
    expect(el.textContent).toContain('(substantiv)');
    expect(el.querySelector('sup').textContent).toBe('1');
    expect(el.querySelector('a').getAttribute('href')).toMatch(/karp.*snus/);
  });

  it('sense', () => {
    component.type = 'sense';
    component.data = 'snus..1';
    component.ngOnInit();
    fixture.detectChanges();
    expect(el.textContent).toContain('snus1');
    expect(el.querySelector('sup').textContent).toBe('1');
    expect(el.querySelector('a').getAttribute('href')).toMatch(/karp.*snus/);
  });

  it('audio/video', () => {
    component.type = 'audio';
    fixture.detectChanges();
    expect(el.querySelector('button')).not.toBeNull();

    component.type = 'video';
    fixture.detectChanges();
    expect(el.querySelector('button')).not.toBeNull();
  });

});
