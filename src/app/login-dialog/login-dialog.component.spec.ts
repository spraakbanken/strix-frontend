import { ModalModule } from 'ngx-bootstrap';
import { LocPipeStub } from '../mocks/loc-stub.pipe';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginDialogComponent } from './login-dialog.component';

describe('LoginDialogComponent', () => {
  let component: LoginDialogComponent;
  let fixture: ComponentFixture<LoginDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ModalModule.forRoot()],
      declarations: [LoginDialogComponent, LocPipeStub],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
