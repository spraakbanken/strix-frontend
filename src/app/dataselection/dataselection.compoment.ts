import { Component, Input, OnInit } from '@angular/core';
import { Subscription, Observable, zip } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as _ from 'lodash';
import { Store } from '@ngrx/store';
import { SEARCH,
INITIATE, AppState, MODE_SELECTED, SELECTED_CORPORA, CHANGELANG
} from '../searchreducer';
import {FormControl } from '@angular/forms';
import { MetadataService } from '../metadata.service';
import { StrixCorpusConfig } from '../strixcorpusconfig.model';

import {SelectionModel} from '@angular/cdk/collections';
import {FlatTreeControl} from '@angular/cdk/tree';
import { Injectable} from '@angular/core';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {BehaviorSubject} from 'rxjs';

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */

/**
 * Node for to-do item
 */
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

/**
 * The Json object for to-do list data.
 */
const TREE_DATA = {
  Groceries: {
    'Almond Meal flour': null,
    'Organic eggs': null,
    'Protein Powder': null,
    Fruits: {
      Apple: null,
      Berries: ['Blueberry', 'Raspberry'],
      Orange: null
    }
  },
  Reminders: [
    'Cook dinner',
    'Read the Material Design spec',
    'Upgrade Application to Angular'
  ]
};

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable()
export class ChecklistDatabase {
  // dataChange = new BehaviorSubject<TodoItemNode[]>([]);

  // get data(): TodoItemNode[] { return this.dataChange.value; }

  // constructor() {
  //   this.initialize();
  // }

  // initialize() {
  //   // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
  //   //     file node as children.
  //   const data = this.buildFileTree(this.treeData, 0);
  //   console.log("----", data)
  //   // Notify the change.
  //   this.dataChange.next(data);
  // }

  // /**
  //  * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
  //  * The return value is the list of `TodoItemNode`.
  //  */
  // buildFileTree(obj: {[key: string]: any}, level: number): TodoItemNode[] {
  //   return Object.keys(obj).reduce<TodoItemNode[]>((accumulator, key) => {
  //     const value = obj[key];
  //     const node = new TodoItemNode();
  //     node.item = key;

  //     if (value != null) {
  //       if (typeof value === 'object') {
  //         node.children = this.buildFileTree(value, level + 1);
  //       } else {
  //         node.item = value;
  //       }
  //     }

  //     return accumulator.concat(node);
  //   }, []);
  // }

  // /** Add an item to to-do list */
  // insertItem(parent: TodoItemNode, name: string) {
  //   if (parent.children) {
  //     parent.children.push({item: name} as TodoItemNode);
  //     this.dataChange.next(this.data);
  //   }
  // }

  // updateItem(node: TodoItemNode, name: string) {
  //   node.item = name;
  //   this.dataChange.next(this.data);
  // }
}

@Component({
  selector: 'dataselection',
  templateUrl: 'dataselection.component.html',
  styleUrls: ['dataselection.component.css'],
  providers: [ChecklistDatabase]
})
export class DataselectionComponent implements OnInit {

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
  public selectedMode = '';
  public corpusesCount = 0;
  public corpusList = new FormControl();
  public gotMetadata = false;

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
  public selectedTokens = 0;
  public disableList = {};
  private unitlist = ["", "K", "M", "G"];
  public showCorpusDetail = {};
  public selectedLanguage : string;
  private inputText: string = "";

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

  constructor(private store: Store<AppState>, private metadataService: MetadataService,)
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

    this.searchRedux.pipe(filter((d) => [CHANGELANG, INITIATE].includes(d.latestAction))).subscribe((data) => {
      this.selectedLanguage = data.lang;
    });

    this.searchRedux.pipe(filter((d) => d.latestAction === MODE_SELECTED)).subscribe((data) => {
      this.totalTokens = 0;
      this.selectedTokens = 0;
      this.selectedMode = data.modeSelected[0];
      this.corpusesInMode = data.corporaInMode[0];
      this.selectedCount = this.corpusesInMode.length;
      this.corpusesCount = this.corpusesInMode.length;
      this.checklistSelection = new SelectionModel<TodoItemFlatNode>(true /* multiple */);
      for (let item of this.corpusesInMode) {
        this.totalTokens = this.totalTokens + this.availableCorpora[item].tokenInCorpora;
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
      // this.treeData[selectedMode] = this.corpusesInMode;
      // this.initialize(this.treeData);
      this.currentLang = data.lang;
      this.corpusDescription = {};
      for (let item in this.availableCorpora) {
        if (this.availableCorpora[item].mode['eng'].toLowerCase() === this.selectedMode) {
          this.corpusDescription[item] = this.availableCorpora[item];
          if (this.availableCorpora[item].folderName) {
            if (_.keys(this.treeData).includes(this.availableCorpora[item].folderName)) {
              this.treeData[this.availableCorpora[item].folderName].push(this.availableCorpora[item].corpusID);
            } else {
              this.treeData[this.availableCorpora[item].folderName] = [this.availableCorpora[item].corpusID];
            }
            
            // this.initialize(this.treeData);
          }
          else if (this.availableCorpora[item].folderName.length === 0) {
            this.treeData[this.availableCorpora[item].corpusID] = null;
            // this.initialize(this.treeData);
          }
        }
        this.initialize(this.treeData);
      }
      this.selectedTokens = this.totalTokens;
      this.corpusList.reset();
      // this.selectedCorpus = [];
      // this.updateFilters();
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
    this.clearInputText();
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if (!this.disableList[this.treeControl.dataNodes[i].item]) {
        if(!this.checklistSelection.isSelected(this.treeControl.dataNodes[i]))
        this.checklistSelection.toggle(this.treeControl.dataNodes[i]);
        this.checklistSelection.select(this.treeControl.dataNodes[i])
      this.treeControl.expand(this.treeControl.dataNodes[i])
      }
    }
    this.updateFiltersX();
  }

  deselectAll(){
    this.clearInputText();
    for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
      if(this.checklistSelection.isSelected(this.treeControl.dataNodes[i]) && !this.disableList[this.treeControl.dataNodes[i].item])
        this.checklistSelection.toggle(this.treeControl.dataNodes[i]);
        this.checklistSelection.deselect(this.treeControl.dataNodes[i])
      this.treeControl.expand(this.treeControl.dataNodes[i])
    }
    this.updateFiltersX();
  }

  defaultSelection() {
    if (this.selectedMode === 'modern') {
      this.clearInputText();
      for (let i = 0; i < this.treeControl.dataNodes.length; i++) {
        if (this.treeControl.dataNodes[i].item === 'wikipedia') {
          if (!this.disableList[this.treeControl.dataNodes[i].item]) {
            if(!this.checklistSelection.isSelected(this.treeControl.dataNodes[i]))
            this.checklistSelection.toggle(this.treeControl.dataNodes[i]);
            this.checklistSelection.select(this.treeControl.dataNodes[i])
          this.treeControl.expand(this.treeControl.dataNodes[i])
          }
        } else {
          if(this.checklistSelection.isSelected(this.treeControl.dataNodes[i]) && !this.disableList[this.treeControl.dataNodes[i].item])
            this.checklistSelection.toggle(this.treeControl.dataNodes[i]);
            this.checklistSelection.deselect(this.treeControl.dataNodes[i])
          this.treeControl.expand(this.treeControl.dataNodes[i])
        }
      }
      this.updateFiltersX();
    } else {
      this.checkAll();
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
        // console.log(i)
      }
    }
    const result = descendants.some(child => this.checklistSelection.isSelected(child));
    // if (this.selectedList.length > 0) {
    //   this.updateFiltersX();
    // }
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
    this.updateFiltersX();
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
    // console.log(this.showCorpusDetail);
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
    // this.store.dispatch({type : CHANGE_IN_ORDER, payload: !val})
  }

  public countNode(item) {
    return parseInt(this.treeData[item].length)
  }

  public selectCorpuses(event) {
    // console.log("++++++++++ ", event.value)
    if (event.value.length === 0) {
      this.selectedCorpus = this.corpusesInMode;
    } else {
      this.selectedCorpus = event.value;
    }
    this.updateFilters();
  }

  private updateFiltersX() {
    let XselectedCorpus = [];
    for (let i of this.checklistSelection.selected) {
      if (!i['expandable']) {
        XselectedCorpus.push(i.item);
      }
    }
    if (XselectedCorpus.length > 0) {
      this.selectedCorpus = XselectedCorpus;
    } else {
      this.selectedCorpus = this.corpusesInMode;
    }
    this.selectedCount = 0;
    this.selectedCount = this.selectedCorpus.length
    this.selectedTokens = 0;
    for (let x of this.selectedCorpus) {
      this.selectedTokens = this.selectedTokens + this.availableCorpora[x].tokenInCorpora;
    }
    this.updateFilters();
  }

  private updateFilters() {
    this.store.dispatch({ type: SELECTED_CORPORA, payload : this.selectedCorpus});
    this.store.dispatch({ type: SEARCH, payload : null});
  }

  ngOnInit() {
}
}