import { Component, OnInit, ViewChild, Input } from '@angular/core';

import { StrixResult, Bucket, Aggregations, Agg } from "../strixresult.model";
import { QueryService } from '../query.service';
import { Store } from '@ngrx/store';

import { ADD_FILTERS, SEARCH } from '../searchreducer';

import * as _ from "lodash";

import Chart from 'chart.js'

declare var Chart : any;

import * as moment from "moment"
window.moment = moment

interface AppState {
  searchRedux: any;
}

@Component({
  selector: 'chart',
  template: `
    <div>
      <canvas (click)="onChartClick($event)" #canvas width="400" height="400"></canvas>
      <div class="minimap_container">
        <div class="cover left" [ngStyle]="{width: ( ((range[0] - min) / (max - min))  * 100 ) + '%'}"></div>
        <div class="cover right" [ngStyle]="{width: ( ((max - range[1]) / (max - min))  * 100 ) + '%'}"></div>
        <nouislider [connect]="true" *ngIf="range.length"
              class="slider"
              [min]="min" 
              [max]="max" 
              [(ngModel)]="range"
              (update)="onZoom()"
              (change)="onZoomChange()"
            ></nouislider>
        <canvas class="minimap" #minimapCanvas width="400" height="80"></canvas>
      </div>
    </div>
  `,
  styleUrls: ["./chart.component.css"]
})
export class ChartComponent implements OnInit {

  @ViewChild("canvas") canvas;
  @ViewChild("minimapCanvas") minimapCanvas;

  // @Input() data : number[];
  private chart : any;
  private minimap : any;
  private data : any[]

  private initResolve;

  private range : any[] = [];

  private min: number;
  private max: number;

  constructor(private queryService: QueryService, private store: Store<AppState>) {

    new Promise((resolve) => this.initResolve = resolve).then( () => {
      queryService.dateHistogramResult$.subscribe(
        (result : StrixResult) => {
          if(!result) {
            // null is the default value for this behaviorsubject and should be ignored
            return
          }
          this.data = this.aggsToChartData(result)
          this.drawChart()
        },
        error => null//this.errorMessage = <any>error
      );
    })

  }

  ngOnInit() {
  }

  onChartClick(event : Event) {
    let activeElements = this.chart.getElementAtEvent(event)
    if(activeElements.length) {
      let {x, y} = this.chart.data.datasets[activeElements[0]._datasetIndex].data[activeElements[0]._index];
      this.registerRangeChange(moment(x).unix(), moment(x).add(1, "year").unix())
    }
  }

  registerRangeChange(from : number, to : number) {
    // TODO: rather than add this should replace filter of field 'datefrom' with new obj.
    this.store.dispatch({ type: ADD_FILTERS, payload : [{
      field: "datefrom",
      value: {
        range: {gte: from, lte: to}
      },
      type : "range"
    }]
  });
  // TODO: should not overwrite /aggs used to build graph. use payload argument to deactivate datefrom agg?
  // this.store.dispatch({ type: SEARCH, payload : null })
  }

  onZoom() {
    let [from, to] = this.range
    console.log("onZoom", moment.unix(from).format("YYYY"), moment.unix(to).format("YYYY"))

    for(let [i, dataset] of _.toPairs(this.chart.data.datasets)) {
      (dataset as any).data = this.minimap.data.datasets[i].data.filter(item => {
        let x = item.x / 1000
        return (x >= from) && (x <= to)
      })
    }
    this.chart.update()
  }

  onZoomChange() {
    let [from, to] = this.range
    this.registerRangeChange(from, to)
  }

  aggsToChartData(result : StrixResult) {
    console.log("aggsToChartData", result)
    let data = _.map(result.aggregations.datefrom.buckets, (bucket: Bucket) => {
      return {
        x: new Date((bucket.key as number) * 1000),
        y: bucket.word_count // or doc_count
      }
    })
    this.min = result.aggregations.datefrom.buckets[0].key
    this.max = _.last(result.aggregations.datefrom.buckets).key
    this.range = [this.min, this.max]
    return data
  }

  // async getChartData() {
  //   let result : StrixResult = await this.queryService.aggregationResult$.take(1).toPromise()
  // }

  drawChart() {
    console.log("drawChart")
    var ctx = this.canvas.nativeElement.getContext('2d');
    if(this.chart) {
      this.chart.destroy()
    }
    this.chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Skrivna ord',
                data: this.data,
                pointBackgroundColor : 'transparent',
                pointBorderColor : "transparent",
                pointHoverBackgroundColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: [
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255,99,132,1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
          lineTension : 0,
          tooltips: {
            displayColors : false,
            callbacks: {
              title(tooltipItem, data) {
                return moment(tooltipItem[0].xLabel).format("YYYY")
              },
              // label(tooltipItem, data) {
              //   console.log("tooltipItem, data", tooltipItem, data)
              //   return data.datasets[tooltipItem.datasetIndex].label || '';
              // }
            }
          },
          bezierCurve: false,
          scales: {
            xAxes: [{
            type: "time",
            display: true,
            scaleLabel: {
              display: false,
              // labelString: 'År'
            },
            ticks: {
              major: {
                  fontStyle: "bold",
                  fontColor: "#FF0000"
              }
            }
          }],
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
          }
        }
    });  

    this.drawMinimap()
  }

  drawMinimap() {
      var ctx = this.minimapCanvas.nativeElement.getContext('2d');
      if(this.minimap) {
        this.minimap.destroy()
      }
      this.minimap = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                // label: 'Skrivna ord',
                data: this.data,
                pointBackgroundColor : 'transparent',
                pointBorderColor : 'transparent',
                fill: false,
                // pointBorderColor : "red",
                backgroundColor: [
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255,99,132,1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
          legend: {
              display: false
          },
          tooltips: {
            enabled: false
          //   displayColors : false,
          //   callbacks: {
          //     title(tooltipItem, data) {
          //       moment(tooltipItem)
          //     },
          //     label(tooltipItem, data) {
          //       console.log("tooltipItem, data", tooltipItem, data)
          //       return "apa"
          //       // return data.datasets[tooltipItem.datasetIndex].label || '';
          //     }
          //   }
          },
          bezierCurve: false,
          scales: {
            xAxes: [{
            type: "time",
            display: false,
            scaleLabel: {
              display: false,
              // labelString: 'År'
            },
          }],
            yAxes: [{
              display : false,
                ticks: {
                    beginAtZero:false
                }
            }]
          }
        }
    });  
  }

  async ngAfterViewInit() {
    console.log("ngAfterViewInit")

    console.log("this.data", this.data)

    // this.drawChart()
    this.initResolve()


    // let result : StrixResult = await this.queryService.aggregationResult$.take(1).toPromise()
    
  }
}
