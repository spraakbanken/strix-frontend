import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import * as _ from 'lodash';
import { CallsService } from 'app/calls.service';
import { StrixDocument } from '../strixdocument.model';
import { FormControl } from '@angular/forms';
import { Options, ChangeContext } from '@angular-slider/ngx-slider';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ChartOptions, ChartType } from 'chart.js';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';
import { LocService } from 'app/loc.service';
import { OPENDOCUMENT, AppState } from '../searchreducer';
import { Store } from '@ngrx/store';
import { AppComponent } from '../app.component';
import { SearchRedux } from '../searchreducer';
import * as d3 from 'd3';

@Component({
  selector: 'similardocs',
  templateUrl: 'similardocs.component.html',
  styleUrls: ['similardocs.component.css']
})

export class SimilarDocsComponent implements OnInit{

  @Input() data: any;
  @Input() related_doc_selection: string;
  public similarDocs: StrixDocument[] = [];
  @Input() currentSelection: string[];

  private searchRedux: Observable<SearchRedux>;
  public filteredData: Observable<any>;
  public filteredDataNew: any;
  public loadSimilar = false;

  public authors : string[] = [];
  public authorC = new FormControl();
  public corpuses : string[] = [];
  public corpusC = new FormControl();
  public focusDocument: any;
  public currentMode: string;

  panelOpenState = false;

  public graph = {};
  public currentColorCode = {};
  public posExist = false;
  public topEntries = [];
  public focusWord: string;
  private touchYear = false;
  private touchToken = false;
  public finishLoading = false;
  public showGraph = false;
  public showWords = [10, 20, 25, 50];
  public colorCode = {'substantiv' : '#edbf33', 'adjektiv': '#76c8c8', 'verb': '#d0f400', 'adverb': '#f46a9b',
    'förled': '#ef9b20', 'interjektion': '#ede15b', 'preposition': '#bdcf32', 'pronomen': '#87bc45',
    'räkneord': '#27aeef', 'subjunktion': '#b33dc6', 'konjuktion': '#54bebe', 'others': '#6cd4c5'
  }

  public tokens: number[] = [];
  public lowerLimit: number = 0;
  public upperLimit: number = 0;
  public minToken: number = 0;
  public maxToken: number = 0;
  public optionsToken: Options = {
    floor: 0,
    ceil: 1000000
  };

  public years: number[] = [];
  public minYear: number = 0;
  public maxYear: number = 0;
  public options: Options = {
    floor: 0,
    ceil: 2022
  };

  public barChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
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
          display: true,
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
    onClick: (evt, chart, chartItem) => {
      if (chartItem.config.data.datasets[0].label === "Corpus") {
        this.corpusC.reset();
        this.authorC.reset();
        this.corpusC.setValue([chartItem.tooltip.title[0]]);
        this.filterData();
      }
      if (chartItem.config.data.datasets[0].label === "Author") {
        this.authorC.reset();
        this.corpusC.reset();
        this.authorC.setValue([chartItem.tooltip.title[0]]);
        this.filterData();
      }
    }
  };
  
  public yearLabels = [];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];

  public yearData = [];
  public authorData = [];
  public authorLabels = [];
  public corpusData = [];
  public corpusLabels = [];
  public documentData = [];
  public documentLabels = [];

  private metadataSubscription: Subscription;
  public availableCorpora: { [key: string] : StrixCorpusConfig} = {};
  public gotMetadata = false;

  constructor(private callsService: CallsService, 
    private metadataService: MetadataService, private locService: LocService,
    private store: Store<AppState>, private appComponent: AppComponent) {
    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        
        if (wasSuccess) {
          this.availableCorpora = metadataService.getAvailableCorpora();
          this.gotMetadata = true;
        } else {
          this.availableCorpora = {}; // TODO: Show some error message
        }
    });
    d3.select('svg').remove();
    this.searchRedux = this.store.select('searchRedux');
  }
  

  public getSimilarDocuments(docIndex: any, relatedDoc: string, currentS: string[]) {
    this.loadSimilar = true;
    this.focusDocument = docIndex; 
    this.callsService.getSimilarDocuments(docIndex.mode_id, docIndex.doc_id, docIndex.corpus_id, currentS, relatedDoc).subscribe(
        answer => {
          this.similarDocs = answer["data"];
          let tempData = [];
          for(let i = 0; i < this.similarDocs.length; i++) {
            if (this.similarDocs[i]['text_attributes']['author']) {
              this.authors.push(this.similarDocs[i]['text_attributes']['author']);
            }
            
            this.corpuses.push(this.similarDocs[i]['corpus_id']);
            if (typeof(this.similarDocs[i]['text_attributes']['year']) === "string") {
                this.years.push.apply(this.years, this.similarDocs[i]['text_attributes']['year'].split(', '));
            }
            this.tokens.push(this.similarDocs[i]['word_count']);
            tempData.push({
                'title': this.similarDocs[i]['title'], 'text': this.similarDocs[i]['preview'], 'corpus_id': this.similarDocs[i]['corpus_id'],
                'docType': this.similarDocs[i]['doc_type'], 'tokens': this.similarDocs[i]['word_count'], 'authors': this.similarDocs[i]['text_attributes']['author'],
                'year': this.similarDocs[i]['text_attributes']['year'], 'most_common_words': this.similarDocs[i]['most_common_words'],
                'ner_tags': this.similarDocs[i]['ner_tags'], 'doc_id': this.similarDocs[i]['doc_id'], 'source_url': this.similarDocs[i]['text_attributes']['url'],
                'mode_id': this.similarDocs[i]['mode_id'], '_score': this.similarDocs[i]['_score']
            });
            if (tempData[0]['mode_id'] === 'so') {
              let word = this.similarDocs[i]['title'].split(' ')[0]
              let pos = this.similarDocs[i]['title'].split(' ')[1].replace('\)', '').replace('\(', '')
              tempData[i]['link'] = "https://spraakbanken.gu.se/karp/?mode=salex&lexicon=salex&query=and(equals%7Cortografi%7C%22"+word+"%22%7C%7Cequals%7Cordklass%7C%22"+pos+"%22)";
              if (this.topEntries.length < 5) {
                this.topEntries.push({'key': word, 'value' : (tempData[i]['_score']*100).toFixed(1)});
              }
              if (_.keys(this.colorCode).includes(pos)) {
                this.graph['nodes'].push({'id': word, 'group': pos, 'colors': this.colorCode[pos], 'value': (tempData[i]['_score']*100).toFixed(1)});
                
              } else {
                this.graph['nodes'].push({'id': word, 'group': pos, 'colors': this.colorCode['others'], 'value': (tempData[i]['_score']*100).toFixed(1)});
                // if (!_.keys(this.currentColorCode).includes('others')) {
                //   this.currentColorCode['others'] = this.colorCode['others'];
                // }
              }
              
              let tempScore = 0
              if (1-tempData[i]['_score'] < 0.1) {
                tempScore = (1-tempData[i]['_score'])*1000
              } else if (1-tempData[i]['_score'] > 0.1 && 1-tempData[i]['_score'] < 0.2) {
                tempScore = ((1-tempData[i]['_score'])+0.1)*1000
              } else if (1-tempData[i]['_score'] > 0.2 && 1-tempData[i]['_score'] < 0.3) {
                tempScore = ((1-tempData[i]['_score'])+0.15)*1000
              } else if (1-tempData[i]['_score'] > 0.3 && 1-tempData[i]['_score'] < 0.4) {
                tempScore = ((1-tempData[i]['_score'])+0.2)*1000
              } else if (1-tempData[i]['_score'] > 0.4 && 1-tempData[i]['_score'] < 0.5) {
                tempScore = ((1-tempData[i]['_score'])+0.25)*1000
              } else {
                tempScore = ((1-tempData[i]['_score'])+0.3)*1000
              }
              this.graph['links'].push({'source': this.focusWord, 'target': word, 'value': tempScore})
            }
        }
        this.similarDocs = tempData;
        // this.authors = _.uniq(this.authors);
        // this.corpuses = _.uniq(this.corpuses);
        this.filteredDataNew = new MatTableDataSource<StrixDocument>(this.similarDocs);
        this.filteredDataNew.paginator = this.paginatorTop;
        this.filteredData = this.filteredDataNew.connect();
        this.loadSimilar = false;
        let authorsData = _.groupBy(this.authors.map(i=>i));
        this.authorLabels = _.keys(authorsData);
        this.authorData = [{data: _.values(authorsData).map(x => x.length), label: this.locService.getTranslationFor('authorS')}];
        let corpusesData = _.groupBy(this.corpuses.map(i=>i));
        this.corpusLabels = _.keys(corpusesData);
        this.corpusData = [{data: _.values(corpusesData).map(x => x.length), label: this.locService.getTranslationFor('corpus'), backgroundColor: ["#CCB97E"]}];
        let dataYear = _.groupBy(this.years.map(i=>Number(i)));
        this.yearLabels = _.keys(dataYear);
        this.yearData = [{data: _.values(dataYear).map(x => x.length), label: this.locService.getTranslationFor('yearS'), backgroundColor: ["#C4AB86"]}];
        this.years = this.years.map(i=>Number(i)).filter((x, i, a) => a.indexOf(x) == i).sort();
        this.minYear = this.years[0];
        this.maxYear = this.years.splice(-1)[0];
        this.setNewOptions(this.maxYear, this.minYear, 'yearRange')
        this.tokens = this.tokens.sort(function(a,b){return a-b});
        for (let i = 0; i < this.tokens.length; i++) {
          this.documentLabels.push(i);
          this.documentData.push(this.tokens[i])
        }
        this.documentData = [{data: this.documentData, label: this.locService.getTranslationFor('tokens'), backgroundColor: ["#BA9238"]}];
        this.lowerLimit = this.tokens[0]
        this.upperLimit = this.tokens.splice(-1)[0];
        this.minToken = this.lowerLimit;
        this.maxToken = this.upperLimit;
        this.setNewOptions(this.maxToken, this.minToken, 'tokenRange');
        this.finishLoading = true;
        });
  }

  public setNewOptions(newCeil: number, newFloor: number, optionName: string): void {
    // Due to change detection rules in Angular, we need to re-create the options object to apply the change
    if (optionName === 'yearRange') {
      const newOptions: Options = Object.assign({}, this.options);
      newOptions.ceil = newCeil;
      newOptions.floor = newFloor;
      this.options = newOptions;
    }
    if (optionName === "tokenRange") {
      const newOptions: Options = Object.assign({}, this.optionsToken);
      newOptions.ceil = newCeil;
      newOptions.floor = newFloor;
      this.optionsToken = newOptions;
    }
  }

  public filterData() {
    let tempData = this.similarDocs;
    const checkRange = (element) => _.inRange(element, this.minYear, this.maxYear+1);
    this.filteredDataNew = []; this.tokens = []; this.documentData = []; this.documentLabels = [];
    if (this.authorC.value !== null && this.authorC.value.length > 0) {        
        tempData = tempData.filter((x) => {return this.authorC.value.includes(x['authors']);})
    }
    if (this.corpusC.value !== null && this.corpusC.value.length > 0) {
        tempData = tempData.filter((x) => {return this.corpusC.value.includes(x['corpusID']);})
    }
    if (this.touchYear) {
    tempData = tempData.filter((x) => {if (typeof(x['year']) === 'string') {return x['year'].split(', ').map(i=>Number(i)).some(checkRange)}})
    }
    if (this.touchToken) {
        tempData = tempData.filter((x) => {return _.inRange(x['tokens'], this.lowerLimit, this.upperLimit) || x['tokens'] === this.upperLimit})
    }
    this.tokens = _.map(tempData, 'tokens');
    for (let i = 0; i < this.tokens.length; i++) {
      this.documentLabels.push(i);
      this.documentData.push(this.tokens[i])
    }
    this.documentData = [{data: this.documentData, label: this.locService.getTranslationFor('tokens'), backgroundColor: ["#BA9238"]}];
    let authorsData = _.groupBy(_.map(tempData, 'authors'));
    this.authorLabels = _.keys(authorsData);
    this.authorData = [{data: _.values(authorsData).map(x => x.length), label: this.locService.getTranslationFor('authorS')}];
    let corpusesData = _.groupBy(_.map(tempData, 'corpusID'));
    this.corpusLabels = _.keys(corpusesData);
    this.corpusData = [{data: _.values(corpusesData).map(x => x.length), label:this.locService.getTranslationFor('corpus'), backgroundColor: ["#CCB97E"]}];
    let dataYear = _.groupBy(_.concat(_.map(tempData, 'year').map(x=>x.split(', '))).map(i=>Number(i)));
    this.yearLabels = _.keys(dataYear);
    this.yearData = [{data: _.values(dataYear).map(x => x.length), label: this.locService.getTranslationFor('yearS'), backgroundColor: ["#C4AB86"]}];
    this.filteredDataNew = new MatTableDataSource<StrixDocument>(tempData);
    this.filteredDataNew.paginator = this.paginatorTop;
    this.filteredData = this.filteredDataNew.connect();
  }

  public onUserChange(changeContext: ChangeContext): void {
    this.minYear = changeContext.value;
    this.maxYear = changeContext.highValue;
    this.touchYear = true;
    this.filterData();
  }

  public onTokenChange(changeContext: ChangeContext): void {
    this.lowerLimit = changeContext.value;
    this.upperLimit = changeContext.highValue;
    this.touchToken = true;
    this.filterData();
  }

  private openDocument(docIndex: number) {
    let doc = this.similarDocs[docIndex];
    this.store.dispatch({type : OPENDOCUMENT, payload : doc});
    this.appComponent.selectedTab.setValue(this.appComponent.listTabs[0]);
  }

  public handlePaginatorTop(e): void {
    const { pageSize, pageIndex } = e;
    this.paginatorTop.pageSize = pageSize
    this.paginatorTop.pageIndex = pageIndex;
    this.paginatorTop.page.emit(e);
}

  public handlePaginatorBottom(e): void {
    const { pageSize, pageIndex } = e;
    this.paginatorBottom.pageSize = pageSize
    this.paginatorBottom.length = this.paginatorTop.length;
    this.paginatorBottom.pageIndex = pageIndex;
  }

  // @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('paginatorTop', { static: false }) paginatorTop: MatPaginator;
  @ViewChild('paginatorBottom', { static: false }) paginatorBottom: MatPaginator;
  
  ngAfterContentChecked(): void {
    if (this.paginatorTop) {
      this.paginatorBottom.length = this.paginatorTop.length;
    }
}
  ngOnInit() {
    this.availableCorpora = this.metadataService.getAvailableCorpora();
    this.getSimilarDocuments(this.data, this.related_doc_selection, this.currentSelection);
    let word = this.data['title'].split(' ')[0]
    let pos = this.data['title'].split(' ')[1].replace('\)', '').replace('\(', '')
    this.focusWord = word;
    this.graph['nodes'] = [];
    this.graph['links'] = [];
    this.graph['nodes'].push({'id': this.focusWord, 'group': pos, 'colors': this.colorCode[pos], 'value': ''})
    this.currentMode = this.data.mode_id;
    d3.select('svg').remove();
  }

  public showGraphData() {
    if (this.showGraph) {
      this.showGraph = false;
    } else {
      this.showGraph = true;
      // this.buildChart(10);
    }
  }

  public buildChart(itemRange) {
    var graphX = {nodes: this.graph['nodes'].slice(0,itemRange), links: this.graph['links'].slice(0,itemRange-1)}
    this.currentColorCode ={};
    this.posExist = false;
    for (let item of graphX.nodes) {
      if (!_.keys(this.colorCode).includes(item['group'])) {
        if (!_.keys(this.currentColorCode).includes('other')) {
          this.posExist = true;
          this.currentColorCode[item['group']] = this.colorCode['others'];
        }
      } else {
        if (!_.keys(this.currentColorCode).includes(item['group'])) {
          this.posExist = true;
          this.currentColorCode[item['group']] = this.colorCode[item['group']];
        } 
      }
    }
    
    var graph = graphX;
    let height = 800;
    let width = 1000;
    d3.select('#chart').selectAll('svg').remove();

    var svg = d3.select('#chart')
      .append('svg')
      .attr("width", width)
      .attr("height", height)
    
    var color = d3.scaleOrdinal()

    var simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id((d: any) => d.id))
      .force('charge', d3.forceManyBody().strength(-10))
      .force('collide', d3.forceCollide((d: any) => d.id === "j" ? 100 : 50))
      .force('center', d3.forceCenter(width / 2, height / 2))
    
    var link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graph.links)
      .join('line')
      .attr('stroke', 'green');
      
    if (itemRange === 10 || itemRange === 20 || itemRange === 25){
      var node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(graph.nodes)
        .enter().append('g');

      node.append('circle')
        .attr('r', ((d:any) => d.id === this.focusWord ? 15 : 0))
        .attr('border', '1px solid red')
        .attr('fill', 'white')
        .attr('stroke', 'black');

      node.append('circle')
        .attr('r', 5)
        .attr('fill', (d: any) => d.colors);
      
      
    
    node.append("text")
      .attr("dx", 8)
      .attr("dy", ".35em")
      .style("text-anchor", "start")
      .text(function (d: any) {
        return d.id;
      })
      .attr("font-family", "sans-serif")
      .attr("font-size", ((d: any) => d.r/ 6))
      .attr("fill", "black");

    node.append("text")
      .attr("dx", 8)
      .attr("dy", "1.3em")
      .style("text-anchor", "start")
      .text(function (d: any) {
        return d.value !== '' ? '(' + d.value+'%)': '';
      })
      .attr("font-family", "sans-serif")
      .attr("font-size", "small")
      .attr("fill", "black");
    } else {
      var node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(graph.nodes)
        .enter().append('g');

      node.append('circle')
        .attr('r', 5)
        .attr('fill', (d: any) => d.colors);      
  
      node.append("text")
        .attr("dx", 8)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(function (d: any) {
          return d.value !== '' ? d.id + ' (' + d.value + '%)' : '';
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", ((d: any) => d.r/ 6))
        .attr("fill", "black");
      }

    simulation
      .nodes(graph.nodes)
      .on('tick', ticked)
    
    simulation.force('link', d3.forceLink(graph.links).id((d: any) => d.id).distance((d: any) => d.value))
    
    function ticked() {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)
    
      node
        .attr('transform', ((d: any) => `translate(${d.x},${d.y})`));
    }
  }
}

