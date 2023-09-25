import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';
import { YEAR_INTERVAL, AppState, MODE_SELECTED, SELECTED_CORPORA, CHANGELANG, INITIATE, OPENDOCUMENT, CLOSEDOCUMENT } from '../searchreducer';
import {FormControl } from '@angular/forms';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';

import {SelectionModel} from '@angular/cdk/collections';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject} from 'rxjs';
import { CallsService } from 'app/calls.service';
import { Options, ChangeContext } from '@angular-slider/ngx-slider';
import { ChartOptions, ChartType, Chart } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

 export class TodoItemNode {
  children: TodoItemNode[];
  item: string;
}

/** Flat to-do item node with expandable and level information */
export class TodoItemFlatNode {
  item: string;
  level: number;
  expandable: boolean;
}

@Component({
  selector: 'dataselection',
  templateUrl: 'dataselection.component.html',
  styleUrls: ['dataselection.component.css'],
})
export class DataselectionComponent implements OnInit {

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective | undefined;

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<TodoItemFlatNode, TodoItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<TodoItemNode, TodoItemFlatNode>();

  /** A selected parent node to be inserted */
  selectedParent: TodoItemFlatNode | null = null;

  /** The new item's name */
  newItemName = '';

  treeControl: FlatTreeControl<TodoItemFlatNode>;

  treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;

  dataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;
  dataSourceX: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;

  /** The selection for checklist */
  checklistSelection = new SelectionModel<TodoItemFlatNode>(true /* multiple */);

  public corpusesInMode: [];
  public corporaListYear = [];
  public selectedYear = {};
  public preSelected = [];
  public folderData = {};
  public selectedMode = '';
  public corpusesCount = 0;
  public corpusList = new FormControl();
  public gotMetadata = false;
  public activeDoc = true;

  private metadataSubscription: Subscription;
  private availableCorpora: { [key: string] : StrixCorpusConfig} = {};
  public corpusDescription = {};
  public currentLang = '';
  public showInformation = false;
  public simpleSearch = false;
  public openClose = 'unfold_more';
  public treeData = {};

  @Input() changeDisable: any;
  public selectedCorpus: any[];
  public selectedCount = 0;
  public totalTokens = 0;
  public totalDocs = 0;
  public selectedTokens = 0;
  public selectedDocs = 0;
  public disableList = {};
  private unitlist = ["", "K", "M", "G"];
  public showCorpusDetail = {};
  public selectedLanguage : string;
  private inputText: string = "";
  public updateGraph = false;
  public yearButton = "lightblue"

  public minYear: number = 0;
  public maxYear: number = 0;
  public globalMinYear: number = 0;
  public globalMaxYear: number = 0;
  public yearData = [];

  public options: Options = {
    floor: 0,
    ceil: 2022
  };

  public barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'Year'
        },
      },
      y: {
        ticks: {
          precision: 0
        },
        grid: {
          display: true,
        },
        title: {
          display: true,
          text: 'Documents'
        },
      }
    },
    plugins: { 
      legend: {
        display: false
      }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartLegend = false;
  public barChartPlugins = [];

  private searchRedux: Observable<any>;

  public selectedList : any[];

  public dataChange = new BehaviorSubject<TodoItemNode[]>([]);

  get data(): TodoItemNode[] { return this.dataChange.value; }

  // constructor() {
  //   this.initialize();
  // }

  initialize(dataInOut) {
    // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
    //     file node as children.
    const data = this.buildFileTree(dataInOut, 0);
    // Notify the change.
    this.dataChange.next(data);
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `TodoItemNode`.
   */
  buildFileTree(obj: {[key: string]: any}, level: number): TodoItemNode[] {
    return Object.keys(obj).reduce<TodoItemNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new TodoItemNode();
      node.item = key;

      if (value != null) {
        if (typeof value === 'object') {
          node.children = this.buildFileTree(value, level + 1);
        } else {
          node.item = value;
        }
      }

      return accumulator.concat(node);
    }, []);
  }

  /** Add an item to to-do list */
  insertItem(parent: TodoItemNode, name: string) {
    if (parent.children) {
      parent.children.push({item: name} as TodoItemNode);
      this.dataChange.next(this.data);
    }
  }

  updateItem(node: TodoItemNode, name: string) {
    node.item = name;
    this.dataChange.next(this.data);
  }

  constructor(private store: Store<AppState>, private metadataService: MetadataService, private callsService: CallsService,)
  {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
      this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.dataSourceX = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    this.dataChange.subscribe(data => {
      this.dataSource.data = data;
      this.dataSourceX.data = data;
    });

    this.metadataSubscription = metadataService.loadedMetadata$.subscribe(
      wasSuccess => {
        if (wasSuccess) {
          this.availableCorpora = metadataService.getAvailableCorpora();
          this.gotMetadata = true;
        } else {
          this.availableCorpora = {}; // TODO: Show some error message
        }
    });

    this.searchRedux = this.store.select('searchRedux');

    this.searchRedux.pipe(filter((d) => d.latestAction === OPENDOCUMENT)).subscribe((data) => {
      // console.log("|openDocument");
      this.activeDoc = false;      
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === CLOSEDOCUMENT)).subscribe((data) => {
      // console.log("|closeDocument");
      this.activeDoc = true;
    });


    this.searchRedux.pipe(filter((d) => [CHANGELANG, INITIATE].includes(d.latestAction))).subscribe((data) => {
      this.selectedLanguage = data.lang;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === YEAR_INTERVAL)).subscribe((data) => {
      this.corporaListYear = [];
      let rangeYear = data.yearInterval
      if (data.yearRoot === "modeRoot") {
      this.callsService.getCorpusId(this.corpusesInMode, data.modeSelected, rangeYear).subscribe((result) => {
        this.corporaListYear = _.map(result["aggregations"]["corpus_id"].buckets.filter(item => item.doc_count != 0), 'key')
        if (this.corporaListYear) {
          this.yearCorpora();
        }
        for (let item of result["aggregations"]["year"].buckets) {
          if (item.doc_count === 0) {
            this.selectedYear[item.key] = "lightblue"
          } else {
            this.selectedYear[item.key] = "#17a2b8"
          }
        }
        
        this.yearData[0]["values"][0]["backgroundColor"] = _.values(this.selectedYear)
        this.chart.chart.data.datasets = this.yearData[0];
        this.chart.render();
      });
      } 
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === MODE_SELECTED)).subscribe((data) => {
      this.totalTokens = 0;
      this.selectedTokens = 0;
      this.totalDocs = 0;
      this.selectedDocs = 0;
      this.selectedMode = data.modeSelected[0];
      this.corpusesInMode = data.corporaInMode[0];
      if (data.modeStatus === "initial") {
        this.preSelected = data.preSelect;
      } else {
        this.preSelected = [];
      }
      this.selectedCount = this.corpusesInMode.length;
      this.corpusesCount = this.corpusesInMode.length;
      this.checklistSelection = new SelectionModel<TodoItemFlatNode>(true /* multiple */);
      this.yearData = [];
      this.callsService.getYearStatistics(this.corpusesInMode, data.modeSelected).subscribe((result) => {
        this.folderData = result["folderData"];
        if (result["aggregations"]['year']) {
          let yearRange = result["aggregations"]['year'].buckets.filter(item => item.doc_count != 0)
          let newYearRange = []
          for (let i of _.map(yearRange, 'key')) {
            newYearRange.push.apply(newYearRange, i.replace(/[^0-9.]/g, '$').replace(/\$+/g, ',').split(','))
          }
          let yearRangeX = _.uniq(_.remove(newYearRange, function(n) { return n.length > 0})).sort((a,b) => (a as any) - (b as any));
          // if (yearRangeX.includes('2050')) {
          //   this.store.dispatch({ type: YEAR_NA, payload: true})
          // } else {
          //   this.store.dispatch({ type: YEAR_NA, payload: false})
          // }
          let x1 = Number(yearRangeX[0]);
          let y1 = 0;
          if (yearRangeX.includes('2050')) {
            y1 = Number(yearRangeX.splice(-2)[0]);
          } else {
            y1 = Number(yearRangeX.splice(-1)[0]);
          }
          this.minYear = x1
          this.maxYear = y1
          this.globalMinYear = x1
          this.globalMaxYear = y1
          this.setNewOptions(this.maxYear, this.minYear, 'yearRange');
          let yearDataX = {};
          for (let i of yearRange) {
            yearDataX[i.key] = i.doc_count
            this.selectedYear[i.key] = "#17a2b8"
          }
          this.yearData.push({'labels': _.keys(yearDataX), 'values': [{'data': _.values(yearDataX), 'backgroundColor': _.values(this.selectedYear)}]})
        }
      });
      for (let item of this.corpusesInMode) {
        this.totalTokens = this.totalTokens + this.availableCorpora[item].tokenInCorpora;
      }
      for (let item of this.corpusesInMode) {
        this.totalDocs = this.totalDocs + this.availableCorpora[item].docInCorpora;
      }
      this.treeData = {};

      this.disableList = {};
      if (window["jwt"]) {
        for (let item in this.availableCorpora) {
          this.disableList[item] = false;
        }
      } else {
        for (let item in this.availableCorpora) {
          this.disableList[item] = this.availableCorpora[item].protectedX;
        }
      }
      this.currentLang = data.lang;
      this.corpusDescription = {};
      for (let item in this.availableCorpora) {
        if (this.availableCorpora[item].modeID.toLowerCase() === this.selectedMode) {
          this.corpusDescription[item] = this.availableCorpora[item];
          if (this.availableCorpora[item].folderName) {
            if (_.keys(this.treeData).includes(this.availableCorpora[item].folderName)) {
              this.treeData[this.availableCorpora[item].folderName].push(this.availableCorpora[item].corpusID);
            } else {
              this.treeData[this.availableCorpora[item].folderName] = [this.availableCorpora[item].corpusID];
            }
          }
          else if (this.availableCorpora[item].folderName.length === 0) {
            this.treeData[this.availableCorpora[item].corpusID] = null;
          }
        }
        this.initialize(this.treeData);
      }
      this.selectedTokens = this.totalTokens;
      this.selectedDocs = this.totalDocs;
      this.corpusList.reset();
      this.defaultSelection("modeRoot");
    });
  }

  getLevel = (node: TodoItemFlatNode) => node.level;

  isExpandable = (node: TodoItemFlatNode) => node.expandable;

  getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;

  hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.item === '';

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TodoItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.item === node.item
        ? existingNode
        : new TodoItemFlatNode();
    flatNode.item = node.item;
    flatNode.level = level;
    flatNode.expandable = !!node.children?.length;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  }

  checkAll(){
    this.store.dispatch({ type: YEAR_INTERVAL, payload : {'getInterval': '', 'getRoot': 'dataRoot'}})
    this.setNewOptions(this.globalMaxYear, this.globalMinYear, 'dataRoot');
    this.clearInputText();
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if (!this.disableList[this.treeControl.dataNodes[i].item]) {
        if(!this.checklistSelection.isSelected(this.treeControl.dataNodes[i]))
        this.checklistSelection.toggle(this.treeControl.dataNodes[i]);
        this.checklistSelection.select(this.treeControl.dataNodes[i])
      this.treeControl.expand(this.treeControl.dataNodes[i])
      }
    }
    this.updateFiltersX('checkAll');
  }

  deselectAll(){
    this.store.dispatch({ type: YEAR_INTERVAL, payload : {'getInterval': '', 'getRoot': 'dataRoot'}})
    this.setNewOptions(this.globalMaxYear, this.globalMinYear, 'dataRoot');
    this.clearInputText();
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if(this.checklistSelection.isSelected(this.treeControl.dataNodes[i]) && !this.disableList[this.treeControl.dataNodes[i].item])
        this.checklistSelection.toggle(this.treeControl.dataNodes[i]);
        this.checklistSelection.deselect(this.treeControl.dataNodes[i])
      this.treeControl.expand(this.treeControl.dataNodes[i])
    }
    this.updateFiltersX('deselectAll');
  }
  
  public yearCorpora(){
    this.clearInputText();
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if (this.corporaListYear.includes(this.treeControl.dataNodes[i].item)) {
        if (!this.disableList[this.treeControl.dataNodes[i].item]) {
          if(!this.checklistSelection.isSelected(this.treeControl.dataNodes[i]))
          this.checklistSelection.toggle(this.treeControl.dataNodes[i]);
          this.checklistSelection.select(this.treeControl.dataNodes[i])
        this.treeControl.expand(this.treeControl.dataNodes[i])
        }
      }
    }
    this.updateFiltersX('yearCorpora');
  }

  public defaultSelection(inputMode) {
    if (inputMode === "modeRoot") {
      if (this.preSelected.length > 0) {
        this.clearInputText();
        for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
          if (this.preSelected.includes(this.treeControl.dataNodes[i].item)) {
            if (!this.disableList[this.treeControl.dataNodes[i].item]) {
              if(!this.checklistSelection.isSelected(this.treeControl.dataNodes[i])) {
                this.checklistSelection.toggle(this.treeControl.dataNodes[i]);
                this.checklistSelection.select(this.treeControl.dataNodes[i]);
                this.treeControl.expand(this.treeControl.dataNodes[i])
              }
            }
          } else {
            if(this.checklistSelection.isSelected(this.treeControl.dataNodes[i]) && !this.disableList[this.treeControl.dataNodes[i].item]) {
              this.checklistSelection.toggle(this.treeControl.dataNodes[i]);
              this.checklistSelection.deselect(this.treeControl.dataNodes[i])
            this.treeControl.expand(this.treeControl.dataNodes[i])
            } 
          }
        }
        this.updateFiltersX("default");
      }
      else if (this.selectedMode === 'default') {
        this.clearInputText();
        for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
          if (this.treeControl.dataNodes[i].item === 'vivill') {
            if (!this.disableList[this.treeControl.dataNodes[i].item]) {
              if(!this.checklistSelection.isSelected(this.treeControl.dataNodes[i])) {
                this.checklistSelection.toggle(this.treeControl.dataNodes[i]);
                this.checklistSelection.select(this.treeControl.dataNodes[i]);
                this.treeControl.expand(this.treeControl.dataNodes[i])
              }
            }
          } else {
            if(this.checklistSelection.isSelected(this.treeControl.dataNodes[i]) && !this.disableList[this.treeControl.dataNodes[i].item]) {
              this.checklistSelection.toggle(this.treeControl.dataNodes[i]);
              this.checklistSelection.deselect(this.treeControl.dataNodes[i])
            this.treeControl.expand(this.treeControl.dataNodes[i])
            } 
          }
        }
        this.updateFiltersX("default");
      } else {
        this.checkAll();
      }
    } 
    if (inputMode !== "modeRoot") {
      this.store.dispatch({ type: YEAR_INTERVAL, payload : {'getInterval': '', 'getRoot': 'dataRoot'}})
      this.setNewOptions(this.globalMaxYear, this.globalMinYear, 'dataRoot');
      if (this.selectedMode === 'default') {
        this.clearInputText();
        for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
          if (this.treeControl.dataNodes[i].item === 'vivill') {
            if (!this.disableList[this.treeControl.dataNodes[i].item]) {
              if(!this.checklistSelection.isSelected(this.treeControl.dataNodes[i])) {
                this.checklistSelection.toggle(this.treeControl.dataNodes[i]);
                this.checklistSelection.select(this.treeControl.dataNodes[i]);
                this.treeControl.expand(this.treeControl.dataNodes[i])
              }
            }
          } else {
            if(this.checklistSelection.isSelected(this.treeControl.dataNodes[i]) && !this.disableList[this.treeControl.dataNodes[i].item]) {
              this.checklistSelection.toggle(this.treeControl.dataNodes[i]);
              this.checklistSelection.deselect(this.treeControl.dataNodes[i])
            this.treeControl.expand(this.treeControl.dataNodes[i])
            } 
          }
        }
        this.updateFiltersX("default");
      } else {
        this.checkAll();
      }
    } 
  }

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.length > 0 && descendants.every(child => {
      return this.checklistSelection.isSelected(child);
    });
    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
    this.selectedList = [];
    const descendants = this.treeControl.getDescendants(node);
    for (let i of descendants) {
      if (this.checklistSelection.isSelected(i)) {
        this.selectedList.push(i.item)
      }
    }
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.forEach(child => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
  }

  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  todoLeafItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: TodoItemFlatNode): void {
    let parent: TodoItemFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
    this.updateFiltersX("checkTree");
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: TodoItemFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected = descendants.length > 0 && descendants.every(child => {
      return this.checklistSelection.isSelected(child);
    });
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /* Get the parent node of a node */
  getParentNode(node: TodoItemFlatNode): TodoItemFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  private showDetails(item) {
    this.showInformation = true;
    this.showCorpusDetail = this.availableCorpora[item]
  }

  private closeDetails() {
    this.showInformation = false;
  }

  private closeSide() {
    this.showInformation = false;
  }

  public selectSearch() {
    if (this.simpleSearch === true) {
      this.simpleSearch = false;
      this.openClose = 'unfold_more';
    }
    else {
      this.simpleSearch = true;
      this.openClose = 'unfold_less';
    }
  }

  public showYearDistribution() {
    if (!this.updateGraph) {
      this.updateGraph = true;
      this.yearButton = '#ff4081';
    } else {
      this.updateGraph = false;
      this.yearButton = 'lightblue';
    }
  }

  public setNewOptions(newCeil: number, newFloor: number, optionName: string): void {
    if (optionName === "yearRange") {
      const newOptions: Options = Object.assign({}, this.options);
      newOptions.ceil = newCeil;
      newOptions.floor = newFloor;
      this.options = newOptions;
    }
    if (optionName === "dataRoot") {
      const newOptions: Options = Object.assign({}, this.options);
      newOptions.ceil = newCeil;
      newOptions.floor = newFloor;
      this.options = newOptions;
      this.minYear = newFloor;
      this.maxYear = newCeil;
    }
  }

  public onYearChange(changeContext: ChangeContext): void {
    this.deselectAll();
    this.minYear = changeContext.value;
    this.maxYear = changeContext.highValue;
    this.store.dispatch({ type: YEAR_INTERVAL, payload : {'getInterval': this.minYear.toString()+"-"+this.maxYear.toString(), 'getRoot': 'modeRoot'}})
  }

  public selectSearchT() {
    this.simpleSearch = false;
  }

  public formatNumber(item) {
    let sign = Math.sign(item)
    let unit = 0;
    while(Math.abs(item) > 1000)
    {
      unit = unit + 1;
      item = Math.floor(Math.abs(item) / 100)/10;
    }
    return sign*Math.abs(item) + this.unitlist[unit]
  }

  /** Select the category so we can insert the new item. */
  addNewItem(node: TodoItemFlatNode) {
    const parentNode = this.flatNodeMap.get(node);
    this.insertItem(parentNode!, '');
    this.treeControl.expand(node);
  }

  /** Save the node to database */
  saveNode(node: TodoItemFlatNode, itemValue: string) {
    const nestedNode = this.flatNodeMap.get(node);
    this.updateItem(nestedNode!, itemValue);
  }

  // filter recursively on a text string using property object value
  public filterRecursive(filterText: string, array: any[], property: string, availableList: {}, langSelected: string) {
    let filteredData;

    function copy(o: any) {
      return Object.assign({}, o);
    }

    if (filterText) {
      filterText = filterText.toLowerCase();
      filteredData = array.map(copy).filter(function x(y) {
        if (availableList[y[property]]) {
          if (availableList[y[property]].name[langSelected].toLowerCase().includes(filterText)) {
            return true;
          }
        }
        
        if (y.children) {
          return (y.children = y.children.map(copy).filter(x)).length;
        }
      });
    } else {
      filteredData = array;
    }

    return filteredData;
  }

  private filterTree(filterText: string) {
    this.dataSource.data = this.filterRecursive(filterText, this.dataSourceX.data, 'item', this.availableCorpora, this.selectedLanguage);
  }

  public applyFilter(filterText: string) {
    this.filterTree(filterText);
    if (filterText) {
      this.treeControl.expandAll();
    } else {
      this.treeControl.collapseAll();
    }
  }

  private clearInputText() {
    this.inputText = "";
    this.checklistSelection = new SelectionModel<TodoItemFlatNode>(true /* multiple */);

    this.applyFilter("");
  }

  public countNode(item) {
    return parseInt(this.treeData[item].length)
  }

  public selectCorpuses(event) {
    if (event.value.length === 0) {
      this.selectedCorpus = this.corpusesInMode;
    } else {
      this.selectedCorpus = event.value;
    }
    this.updateFilters();
  }

  private updateFiltersX(inputString) {
    let XselectedCorpus = [];
    for (let i of this.checklistSelection.selected) {
      if (!i['expandable']) {
        XselectedCorpus.push(i.item);
      }
    }
    if (XselectedCorpus.length > 0) {
      this.selectedCorpus = XselectedCorpus;
    } else {
      this.selectedCorpus = []; // this.corpusesInMode;
    }
    this.selectedCount = 0;
    if (inputString === 'deselectAll') {
      this.selectedCount = 0
    } else {
      this.selectedCount = this.selectedCorpus.length
    }
    this.selectedTokens = 0;
    for (let x of this.selectedCorpus) {
      this.selectedTokens = this.selectedTokens + this.availableCorpora[x].tokenInCorpora;
    }
    this.selectedDocs = 0;
    for (let x of this.selectedCorpus) {
      this.selectedDocs = this.selectedDocs + this.availableCorpora[x].docInCorpora;
    }
    this.updateFilters();
  }

  private updateFilters() {
    this.store.dispatch({ type: SELECTED_CORPORA, payload : this.selectedCorpus});
    // this.store.dispatch({ type: SEARCH, payload : null});
  }

  ngOnInit() {
}
}