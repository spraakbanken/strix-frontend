import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { CmDirective } from '../cm.directive'
import { DocumentsService } from '../../documents.service';
//import { Subscription }   from 'rxjs/Subscription';
import { StrixDocument } from '../../strixdocument.model';
import { StrixSelection } from '../../strixselection.model';
import * as _ from 'lodash';

@Component({
  selector: 'cmp',
  templateUrl: './cmp.component.html',
  styleUrls: ['./cmp.component.css']
})
export class CmpComponent implements OnInit {
  @Output() onSelectionChangeP = new EventEmitter<StrixSelection>();
  @Output() onViewportChangeP = new EventEmitter<any>();
  @Output() onFocusP = new EventEmitter<number>();
  @Output() onScrollP = new EventEmitter<number>();
  @Output() onKeydownP = new EventEmitter<any>();

  @Input() index: number;

  codeMirrorInstanceP: any;
  
  constructor(private documentsService : DocumentsService) {}

  ngOnInit() {}

  onInstanciated(cmInstance: any) {
    // console.log("got the cm instance", cmInstance);
    this.codeMirrorInstanceP = cmInstance;
    
    this.codeMirrorInstanceP.on('beforeSelectionChange', (instance, obj) => {
      // This event is fired before the selection is moved. Its handler may inspect the set
      // of selection ranges, present as an array of {anchor, head} objects in the ranges
      // property of the obj argument, and optionally change them by calling the update method
      // on this object, passing an array of ranges in the same format. [...]
      
      let newSelections = this.snapSelections(obj.ranges);
      obj.update(newSelections);
    });

    this.codeMirrorInstanceP.on('cut', () => {
      this.trimSelections();
    });
    this.codeMirrorInstanceP.on('copy', () => {
      this.trimSelections();
    });

    this.codeMirrorInstanceP.on('update', () => {
      // console.log("cm update", this.codeMirrorInstance);
    });

    this.codeMirrorInstanceP.on('cursorActivity', (instance) => {
      const padding = 12;
      var selections = instance.listSelections();
      // console.log("cursorActivityS: " + selections.length + " selections.");
      // [{'anchor' : {line : …, ch : …}, 'head' : {line : …, ch : …}}]
      if (selections.length === 1) {
        var firstLine = selections[0].anchor.line;
        var firstChar = selections[0].anchor.ch
        var lastLine = selections[0].head.line;
        var lastChar = selections[0].head.ch;
        var strixSelection = new StrixSelection(firstLine, firstChar - padding, lastLine, lastChar - padding - 1);
        strixSelection.realCoordinates = instance.cursorCoords(true, "window") // REM: Second param could be "page", "local" or "window"
        this.emitSelectionChange(strixSelection);
      }
    });

    this.codeMirrorInstanceP.on('focus', (instance, event) => {
      this.onFocusP.emit(this.index);
    });

    this.codeMirrorInstanceP.on('scroll', (instance, event) => {
      this.onScrollP.emit(this.codeMirrorInstanceP.getViewport());
    });

    this.codeMirrorInstanceP.on('keydown', (instance, event) => {
      this.onKeydownP.emit({"index" : this.index, "event" : event});
    });

    this.codeMirrorInstanceP.on('viewportChange', (instance, from, to) => {
      this.onViewportChangeP.emit({"index" : this.index, from: from, to: to});
    });

  }

  private emitSelectionChange(strixSelection: StrixSelection) {
    this.onSelectionChangeP.emit(strixSelection);
  }

  /*
    We need to transform the selection when users copy text
    because otherwise they will get the hidden line- and document id:s
    prefixing each line.
  */
  private trimSelections() {
    const padding = 12;

    var newSelections = [];
    var oldSelections = this.codeMirrorInstanceP.listSelections();
    for (var os of oldSelections) {
      var anchor = os.anchor;
      var head = os.head;
      
      // We assume that the anchor is the start and the head is the end.
      // It is not really clear if this property holds.

      var numberOfLines = Math.abs(anchor.line - head.line) + 1;

      if (numberOfLines === 1) {
        if (anchor.ch < padding) {
          this.codeMirrorInstanceP.setSelection({line : anchor.line, ch : padding}, head);
        } else if (head.ch < padding) {
          this.codeMirrorInstanceP.setSelection(anchor, {line : anchor.line, ch : padding});
        }
      } else {
        // If the selection is multi line, it needs to be separated to multiple selections.
        let firstLineNo = Math.min(anchor.line, head.line);
        let lastLineNo = Math.max(anchor.line, head.line);
        let isInverted = ( head.line < anchor.line );
        for (let lineNumber = firstLineNo; lineNumber <= lastLineNo; lineNumber++) {
          let anchorCh: number;
          let headCh: number;
          if (lineNumber === firstLineNo) {
              anchorCh = isInverted ? null : Math.max(padding, anchor.ch);
              headCh = isInverted ? Math.max(padding, head.ch) : null;
          } else if (lineNumber === lastLineNo ) {
              anchorCh = isInverted ? anchor.ch-1 : padding;
              headCh = isInverted ? padding : head.ch-1;
          } else { // It's a line in the middle
            anchorCh = isInverted ? null : padding;
            headCh = isInverted ? padding : null;
          }
          if (anchorCh !== headCh) { // Skip empty selections
            let newSelection = {
              anchor: {line: lineNumber, ch: anchorCh},
              head: {line: lineNumber, ch: headCh}
            };
            newSelections.push(newSelection);
          }
        }
      }
    }
    this.codeMirrorInstanceP.setSelections(newSelections);
  }

  /* This makes sure that the user only can select whole tokens.
    It needs some tweaking to handle whitespace and interpunctuation better. */
  private snapSelections(selections) {
    const padding = 12;

    for (var selection of selections) {
      var startingWordRange;
      var endingWordRange;
      if ( (selection.anchor.line < selection.head.line) || 
              ( (selection.anchor.line === selection.head.line)
              && selection.anchor.ch < selection.head.ch )) {
        // Normal
        startingWordRange = this.codeMirrorInstanceP.findWordAt(selection.anchor);
        endingWordRange = this.codeMirrorInstanceP.findWordAt(selection.head);
      } else {
        // Inverted
        endingWordRange = this.codeMirrorInstanceP.findWordAt(selection.anchor);
        startingWordRange = this.codeMirrorInstanceP.findWordAt(selection.head);
      }

      startingWordRange.anchor.ch = Math.max(startingWordRange.anchor.ch, padding);
      startingWordRange.head.ch = Math.max(startingWordRange.head.ch, padding);

      endingWordRange.anchor.ch = Math.max(endingWordRange.anchor.ch, padding);
      endingWordRange.head.ch = Math.max(endingWordRange.head.ch, padding);

      selection.anchor = startingWordRange.anchor;
      selection.head = endingWordRange.head;
    }

    return selections;
  }

}
