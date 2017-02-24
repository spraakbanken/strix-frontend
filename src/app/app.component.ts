import * as _ from 'lodash';
import { Component } from '@angular/core';
import { RoutingService } from './routing.service';
import { DocumentsService } from './documents.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  
  constructor(private routingService: RoutingService) {
    console.log(_.add(1, 3)); // Just to test lodash
  }

}
