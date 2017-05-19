import { Component, OnInit, ViewChild, Renderer, Output, Input, ElementRef } from '@angular/core';
import * as Rickshaw from "rickshaw";
import * as moment from "moment";
import * as _ from 'lodash';

@Component({
  selector: 'histogram',
  templateUrl: './histogram.component.html',
  styleUrls: ['./histogram.component.css']
})
export class HistogramComponent implements OnInit {
  @ViewChild('preview') previewElem: ElementRef;
  @ViewChild('graph') graphElem: ElementRef;

  @Input() set indata(indata: any) {
    console.log("setting indata to histogram.");
    this.setup(indata);
  };

  @Output() from: Date;
  @Output() to: Date;

  private graph: any;
  private data: any[] = [];

  private initiated = false;

  constructor(private renderer : Renderer) { }

  ngOnInit() {
    
  }

  private setup(histogramData) {

    if (histogramData === undefined || histogramData.length === 0) {
      console.log("No histogram data available. Hiding the histogram.");
      return;
    };

    this.data.length = 0; // Trick to clear the array cheaply while not killing it's pointer
    for(let item in histogramData) {
      this.data.push(histogramData[item]);
    }
    

    if (! this.initiated) {

      let time = new Rickshaw.Fixtures.Time();

      this.graph = new Rickshaw.Graph({
        element : this.graphElem.nativeElement,
        renderer : 'area',
        interpolation : "linear",
        series : [{
          color : '#515377',
          data : this.data
        }],
        padding : {
          top : 0.1,
          right : 0.01   
        }
      });
      this.graph.render();

      let xAxis = new Rickshaw.Graph.Axis.Time({
        graph: this.graph,
        timeUnit: {
          name : 'semicentennial',
          seconds : 86400 * 365.25 * 50,
          formatter : (d) => { return (parseInt(String(d.getUTCFullYear() / 50), 10) * 50) }
        }
      }); 

      xAxis.render();


      let preview = new Rickshaw.Graph.RangeSlider.Preview({
        graph: this.graph,
        element: this.previewElem.nativeElement
      });

      let hoverDetail = new Rickshaw.Graph.HoverDetail( {
        graph : this.graph,
        xFormatter : (x) => {
          let m = moment.unix(x);
          return `<span>${m.format('YYYY')}</span>`;
        },
        yFormatter : (y) => {
          return y
        },
        formatter : (series, x, y, formattedX, formattedY, d) => {
          let i = _.indexOf((_.map(series.data, "x")), x, true);
          return `Antal ord: ${formattedY}<br>Verk: ${series.data[i].titles.join("<br>")}`;
        }
      });

      this.renderer.listen(this.previewElem.nativeElement, "mouseup", (event : Event) => {
        let target = event.target;
        let {x, y} = this.graph.renderer.domain();
        let [xFrom, xTo] = x;
        this.from = xFrom;
        this.to = xTo;

        // TODO: import moment, use for formatting date
        // then use range query with sigterms aggs

      });

      this.initiated = true;

    } else { // If already initiated

      this.graph.update();

    }
  }

}
