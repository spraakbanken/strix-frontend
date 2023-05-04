import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DocumentsService } from '../documents.service';
import { MetadataService } from '../metadata.service';
import { CallsService } from '../calls.service';
import { StrixDocument } from '../strixdocument.model';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { LocService } from '../loc.service';
import { ChartOptions, ChartType } from 'chart.js';


export interface WordData {
    key: string;
    doc_count: number;
}

@Component({
  selector: 'document-statistic',
  templateUrl: './document-statistic.component.html',
  styleUrls: ['./document-statistic.component.css']
})
export class DocumentStatisticComponent implements OnInit {

  displayedColumns: string[] = ["key", "doc_count"]
  dataSource: MatTableDataSource<WordData>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  subscription : Subscription;
  private mainDocument: StrixDocument;

  /* Metadata */
  private gotMetadata = false;
  private metadataSubscription: Subscription;
  private availableCorpora: { [key: string] : StrixCorpusConfig} = {};
  public wordAnnotations = [];
  public elementList = [];
  public countList = [];
  public selectedAnnotation: string;
  public selectedAnnotationValue: string;
  public selectedAnnotationStructuralType = 'token';
  public structuralAnnotations = [];
  private currentCorpusID: string;
  private currentDocumentID: string;
  public getTheName = "lemgram";
  public getDataLength : Number;

  private errorMessage;

  public annotationValues = [];

  public barChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        displayColors: false,
        callbacks: {
          title: function(tooltipItems) {
            return ''
          },
          label: function(tooltipItems) {
            return tooltipItems['label'] + " : " + tooltipItems['formattedValue']
          },
        }
      }
    },
    scales: {
      x: {
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          precision: 0
        },
        title: {
          display: true,
          text:this.locService.getTranslationFor('frequency')
        },
      }
    },
  };

  public barChartType: ChartType = 'bar';
  public barChartLegend = false;
  public barChartPlugins = [];

  constructor(private documentsService: DocumentsService,
              private metadataService: MetadataService,
              private callsService: CallsService,
              public _MatPaginatorIntl: MatPaginatorIntl,
              private locService: LocService) {
                this.dataSource = new MatTableDataSource([]);
               }

  ngOnInit() {
    this.subscription = this.documentsService.loadedDocument$.subscribe(
      message => {
        console.log("A document has been fetched.", message);
        this.mainDocument = this.documentsService.getDocument(message.documentIndex);

        this.currentCorpusID = this.mainDocument.corpusID;
        this.currentDocumentID = this.mainDocument.doc_id;
        this.updateAnnotationsLists(this.currentCorpusID);
        this.getName("lemgram");
    });
  }

//   ngAfterViewInit() {
//     this.dataSource.paginator = this.paginator;
//     this.dataSource.sort = this.sort;
//   }

  public applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private updateAnnotationsLists(corpusID: string) {
    this.wordAnnotations = [];
    this.wordAnnotations = this.metadataService.getWordAnnotationsFor(corpusID);
    this.structuralAnnotations = this.metadataService.getStructuralAnnotationsFor(corpusID);
    this.structuralAnnotations = this.structuralAnnotations.filter(item => !["page", "sentence"].includes(item.name))
    // console.log("this.structuralAnnotations", this.structuralAnnotations);
  }

  private selectAnnotation(annotation: string, structure: string = null) {
    this.annotationValues = [];
    let augAnnotation = annotation;
    let newData = [];
    if (structure) {
      augAnnotation = `${structure}.${augAnnotation}`;
    }
    // Getting the annotation values for the selected annotation
    this.callsService.getValuesForAnnotation(this.currentCorpusID, this.currentDocumentID, augAnnotation)
    .subscribe(
      answer => {
        let values = answer.aggregations[augAnnotation].buckets;
        this.annotationValues = values;
        newData = this.annotationValues;
        // console.log("newData", newData, this.annotationValues);
      },
      error => this.errorMessage = <any>error
    );
    if (newData.length > 0) {
        return newData
    }
  }

  public getName(name: string) {
    this.getTheName = name;
    let augAnnotation = name;
    let newData = [];
    this.annotationValues = [];
    this.callsService.getValuesForAnnotation(this.currentCorpusID, this.currentDocumentID, augAnnotation)
    .subscribe(
      answer => {
        let values = answer.aggregations[augAnnotation].buckets;
        // this.annotationValues = values;
        newData = values;
        this.dataSource = new MatTableDataSource(newData);
        this.elementList = _.map(newData, 'key')
        this.countList = [{data: _.map(newData, 'doc_count'), label: ""}];
        this.getDataLength = newData.length;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error => this.errorMessage = <any>error
    );
  }
}
