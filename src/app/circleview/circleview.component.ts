import { Component, Input, ChangeDetectionStrategy, OnChanges, OnInit } from '@angular/core';
import { AppState, OPENDOCUMENT, CLOSEDOCUMENT, SearchRedux } from 'app/searchreducer';
import * as d3 from 'd3';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'circleview',
  templateUrl: './circleview.component.html',
  styleUrls: ['./circleview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CircleViewComponent implements OnChanges, OnInit {
  @Input() viewData = [];

  private searchRedux: Observable<SearchRedux>;

  constructor(private store: Store<AppState>) {

    d3.select('svg').remove();

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.pipe(filter((d) => d.latestAction === OPENDOCUMENT)).subscribe((data) => {
      d3.select('svg').remove();
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CLOSEDOCUMENT)).subscribe((data) => {
      d3.select('svg').remove();
    });
  }

  buildChart() {
    let height = 400;
    let width = 600;
    let color = d3.scaleOrdinal(d3.schemeAccent);

    let bubble = d3.pack()
      .size([width, height])
      .padding(1.5);

    d3.select('#chart').selectAll('svg').remove();

    let svg = d3.select('#chart')
      .append('svg')
      .attr("width", width)
      .attr("height", height)
      .attr("class", "bubble");

    let _this = this

    let nodes = d3.hierarchy(_this.viewData)
      .sum(function (d: any) {
        return d.value;
      });

    let node = svg.selectAll(".node")
      .data(bubble(nodes).descendants())
      .enter().append("svg")
      .filter(function (d) {
        return !d.children
      })
      .append("g")
      .attr("class", "node")
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      }).style("fill", function (d, i: any) {
        return color(i);
      });

    node.append("title")
      .text(function (d: any) {
        return d.id + ": " + d.value;
      });

    node.append("circle")
      .attr("x", function (d) { return d.x; })
      .attr("y", function (d) { return d.y })
      .attr("r", function (d) {
        return d.r;
      })
      .style("fill", function (d, i: any) {
        return color(i);
      });

    node.append("text")
      .attr("dy", ".2em")
      .style("text-anchor", "middle")
      .text(function (d: any) {
        return d.data.id.substring(0, d.r / 3);
      })
      .attr("font-family", "sans-serif")
      .attr("font-size", function (d) {
        return d.r / 5;
      })
      .attr("fill", "white");

    node.append('text')
      .attr("dy", "1.3em")
      .style("text-anchor", "middle")
      .text(function (d: any) {
        return d.data.value;
      })
      .attr("font-family", "Gill Sans")
      .attr("font-size", function (d) {
        return d.r / 5;
      })
      .attr("fill", "white");
  }

  ngOnInit() {
    d3.select('svg').remove();
  }

  ngOnChanges() {
    this.buildChart();
  }
}