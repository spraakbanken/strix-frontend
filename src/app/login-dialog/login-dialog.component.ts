import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap';

@Component({
  selector: 'login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.css']
})
export class LoginDialogComponent implements OnInit {
  @ViewChild('loginContent') loginContent: ElementRef;

  modalRef: BsModalRef;

  constructor(private modalService: BsModalService) {
  }

  ngOnInit() {
    this.modalRef = this.modalService.show(this.loginContent);
    this.modalService.onHidden.subscribe(() => {
      window.location.href = window.location.pathname;
    })
  }

  public gotoLogin() {
    window.location.href = `https://sp.spraakbanken.gu.se/auth/login?redirect=${encodeURIComponent(window.location.toString())}`
  }
}
