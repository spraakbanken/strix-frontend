import { Component, Input, ChangeDetectionStrategy, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { AppState, OPENDOCUMENT, CLOSEDOCUMENT, SearchRedux, CHANGE_INCLUDE_FACET, FACET_LIST, CHANGEQUERY, SELECTED_CORPORA } from 'app/searchreducer';
import * as d3 from 'd3';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CallsService } from 'app/calls.service';
import * as _ from 'lodash';
import { AppComponent } from 'app/app.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

export interface WordData {
  key: string;
  doc_count: number;
}

@Component({
  selector: 'topicview',
  templateUrl: './topicview.component.html',
  styleUrls: ['./topicview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopicViewComponent implements OnChanges, OnInit {
  // @Input() viewData = [];

  private searchRedux: Observable<SearchRedux>;
  public dataFromFacet = [];
  public currentTopics = [];
  public selectedTopics : string[];
  public topicData = {};
  public currentC : string[];
  public keywordSearch : boolean;
  public indexRef = 0;
  public modeS = '';
  public searchString = '';
  public locationCorpora = {};
  public currentFacets: string[];
  public selectedOptions : string[];
  public defaultTextAttr = 'swefn';

  public elementList = [];
  public countList = [];
  public getDataLength : Number;

  displayedColumns: string[] = ["key", "doc_count"]
  dataSource: MatTableDataSource<WordData>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  @Input() viewTopic: string;

  constructor(private store: Store<AppState>, private callsService: CallsService, public _MatPaginatorIntl: MatPaginatorIntl, private appComponent: AppComponent) {
    this.dataSource = new MatTableDataSource([]);
    d3.select('svg').remove();

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.pipe(filter((d) => d.latestAction === OPENDOCUMENT)).subscribe((data) => {
      d3.select('svg').remove();
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CLOSEDOCUMENT)).subscribe((data) => {
      d3.select('svg').remove();
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CHANGEQUERY)).subscribe((data) => {
      this.searchString = '';
      this.searchString = data.query;
      this.getFacetData(this.defaultTextAttr);
    })

    this.searchRedux.pipe(filter((d) => d.latestAction === SELECTED_CORPORA)).subscribe((data) => {
      this.searchString = '';
      this.searchString = data.query;
      this.currentC = [];
      this.currentC = data.selectedCorpora;
      this.getFacetData(this.defaultTextAttr);
    })

    this.searchRedux.pipe(filter((d) => d.latestAction === FACET_LIST)).subscribe((data) => {
      let _1 = data.facet_list;
      _1 = _.pick(
          _1, 
          ['year', 'party_name', 'blingbring', 'swefn', 'topic_topic_name', 'type', 'author', 
          'topic_author_signature', 'newspaper', 'categories', 'month'])
      let tempOrder = ['year', 'newspaper', 'type', 'author', 'party_name', 'swefn', 'topic_topic_name', 
          'topic_author_signature', 'blingbring', 'categories', 'month']
      let tempNew = []
      for (let i of tempOrder) {
        if (_.keys(_1).includes(i)) {
          tempNew.push({'key': i})
        }
      }
      this.currentFacets = tempNew;
      });

    this.searchRedux.pipe(filter((d) => d.latestAction === CHANGE_INCLUDE_FACET)).subscribe((data) => {
        if (data.include_facets.length > 0 && data.corporaInMode[0].length > 0) {
          this.currentC = data.selectedCorpora;
          this.modeS = data.modeSelected[0];
          this.searchString = data.query;
          this.keywordSearch = data.keyword_search;
          this.dataFromFacet = [];
          this.currentTopics = [];
          let x = ['corpus_id', 'mode_id', this.defaultTextAttr]
          this.selectedOptions = [];
          this.selectedOptions.push(this.defaultTextAttr)
          this.callsService.getFacetStatistics(data.selectedCorpora, data.modeSelected, x, data.query, data.keyword_search, data.filters).subscribe((result) => {
            this.dataFromFacet = result.aggregations[this.defaultTextAttr].buckets;
            let tempObject = [];
            let tempTable = [];
            for (let i of this.dataFromFacet) {
                tempObject.push({'group': 'Corpus', 'id': i.key.split("_").join(" "), 'title': i.key.split("_").join(" "), 'value': i.doc_count})
                this.currentTopics.push({'id': i.key, 'key': i.key.split("_").join(" ")+ " (" + i.doc_count + ")", 'value': i.key.split("_").join(" ")})
                tempTable.push({'key': i.key.split("_").join(" "), 'doc_count': i.doc_count})
              }
              this.dataSource = new MatTableDataSource(tempTable);
              this.elementList = [];
              this.elementList = _.map(tempTable, 'key')
              this.countList = [{data: _.map(tempTable, 'doc_count'), label: ""}];
              this.getDataLength = tempTable.length;
              this.dataSource.paginator = this.paginator;
              this.dataSource.sort = this.sort;
            this.topicData = {'children' : [{'name': 'Corpus', 'children': tempObject}]}
          });
        }
        
      });
  }

  public applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public getFacetData(item: string) {
    this.selectedOptions = []
    this.topicData = {};
    this.selectedOptions.push(item)
    let xList = ['corpus_id', 'mode_id'];
    this.dataFromFacet = [];
    this.currentTopics = [];
    this.selectedTopics = [];
    this.defaultTextAttr = item;
    xList.push(item)
    if (this.currentC.length > 0) {
        this.callsService.getFacetStatistics(this.currentC, [this.modeS], xList, this.searchString, this.keywordSearch, []).subscribe((result) => {
          this.dataFromFacet = result.aggregations[item].buckets;
          // console.log(this.searchString)
          let tempObject = [];
          let tempTable = [];
          for (let i of this.dataFromFacet) {
              tempObject.push({'group': 'Corpus', 'id': i.key.split("_").join(" "), 'title': i.key.split("_").join(" "), 'value': i.doc_count})
              this.currentTopics.push({'id': i.key, 'key': i.key.split("_").join(" ")+ " (" + i.doc_count + ")", 'value': i.key.split("_").join(" ")})
              if (i.doc_count > 0) {
                tempTable.push({'key': i.key.split("_").join(" "), 'doc_count': i.doc_count})
              }
            }
            this.dataSource = new MatTableDataSource(tempTable);
            this.elementList = [];
            this.elementList = _.map(tempTable, 'key')
            this.countList = [{data: _.map(tempTable, 'doc_count'), label: ""}];
            this.getDataLength = tempTable.length;
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          this.topicData = {'children' : [{'name': 'Corpus', 'children': tempObject}]}
          this.buildChart();
        });
    }   
}

  public showTopicHits(event, event1) {
    this.callsService.getDataforFacet(this.currentC, [this.modeS], this.selectedOptions[0], [event], this.searchString, this.keywordSearch).subscribe((result) => {
      let _1 = _.values(result.aggregations)
        let _2 = {};
        for (let x = 0; x < _1.length; x++) {
          _2[_1[x]['key']] = [_1[x]['value'],_1[x]['key']]
        }
        let x = {};
        for (let item of _2[event][0]) {
        x[item['key']] = item['doc_count']
        }
        let doc = {'filterStat': [{'field': this.selectedOptions[0], 'value': event+'-0'}], 'current_corpora': this.currentC, 'query': this.searchString, 'keyword': this.keywordSearch, 'fromPage': 0, 'toPage': 5, 'sideBar': x};
        this.appComponent.listViewTabs.push('++'+event1+ this.indexRef.toString()); // ('DocSim-' + docIndex);
        let tempOption = event1 + this.indexRef.toString();
        this.indexRef = this.indexRef + 1;
        this.appComponent.selectedViewTab.setValue(this.appComponent.listViewTabs.length - 1);
        this.appComponent.statParam[tempOption] = doc;
      });
      
    
 }

  buildChart() {
    let me = this;
    let height = 800;
    let width = 1000;
    let color = d3.scaleOrdinal(d3.schemeCategory10);

    let bubble = d3.pack()
      .size([width, height])
      .padding(1.5);

    d3.select('#chart').selectAll('svg').remove();
    // d3.selectAll('#chart').on("click", function (d) {
    //   console.log(d)
    // })
    let svg = d3.select('#chart')
      .append('svg')
      .attr("width", width)
      .attr("height", height)
      .attr("class", "bubble");

    let _this = this
    let nodes = d3.hierarchy(_this.topicData)
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
        return d.data.id + ": " + d.value;
      });

    node.append("circle")
      .attr("x", function (d) { return d.x; })
      .attr("y", function (d) { return d.y })
      .attr("r", function (d) {
        return d.r;
      })
      .style("fill", function (d, i: any) {
        return color(i);
      })
      .style("cursor", "pointer")
      .on("click", function (d, i) { 
        me.showTopicHits(i.data['id'].split(" ").join("_"), i.data['id']);
      });

    node.append("text")
      .attr("dy", ".2em")
      .style("text-anchor", "middle")
      .text(function (d: any) {
        return d.data.id.substring(0, d.r / 3);
      })
      .attr("font-family", "sans-serif")
      .attr("font-size", function (d) {
        return d.r / 6;
      })
      .attr("fill", "white");

    node.append('text')
      .attr("dy", "1.3em")
      .style("text-anchor", "middle")
      .text(function (d: any) {
        return d.data.value;
      })
      .attr("font-family", "Gill Sans")
      .attr("font-size", function(d) {
        return d.r / 5;
      })
      .attr("fill", "white");
  }

  ngOnInit() {
    d3.select('svg').remove();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.appComponent.currentCount > 1) {
      this.getFacetData(this.defaultTextAttr);
    }
    // if (changes.viewTopic.currentValue === 'Topics') {
    //     this.buildChart();
    // }
  }
}