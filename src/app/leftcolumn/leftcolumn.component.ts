import { Component, OnInit } from '@angular/core';
import { Subscription }   from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { QueryService } from '../query.service';
import { MetadataService } from '../metadata.service';

@Component({
  selector: 'leftcolumn',
  templateUrl: './leftcolumn.component.html',
  styleUrls: ['./leftcolumn.component.css']
})
export class LeftcolumnComponent implements OnInit {

  private availableCorpora: string[] = [];
  private selectedCorpusID: string = "vivill"; // TODO: Temporary
  private metadataSubscription: Subscription;

  constructor(private metadataService: MetadataService,
              private queryService: QueryService) {
    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.availableCorpora = metadataService.getAvailableCorpora();
          console.log("availableCorpora", this.availableCorpora);
        } else {
          this.availableCorpora = []; // TODO: Show some error message
        }
    });
  }

  private chooseCorpus(corpusID: string) {
      this.selectedCorpusID = corpusID;
      this.queryService.chooseCorpora([this.selectedCorpusID]);
      this.queryService.registerUpdate();
  }

  ngOnInit() {
  }

}
