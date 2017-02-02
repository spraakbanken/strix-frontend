import * as _ from 'lodash';
import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  
  constructor(private router: Router, private route: ActivatedRoute) {
    console.log(_.add(1, 3)); // Just to test lodash

    this.route.params.subscribe(params => {
      console.log("new params", params);
    });
  }

  

}
