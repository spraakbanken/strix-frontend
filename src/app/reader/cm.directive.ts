import { Directive, Output, Input, EventEmitter, ElementRef } from '@angular/core';
import * as CodeMirror from 'codemirror';

@Directive({
  selector: '[cm]'
})
export class CmDirective {
  @Output() onInstanciated = new EventEmitter<any>();

  editor: any;
  static definedCodeMirrorMode = false;

  constructor(private _el: ElementRef) {
    if (! CmDirective.definedCodeMirrorMode ) this.defineCodeMirrorMode();
  }

  ngAfterViewInit() {
    this.editor = CodeMirror.fromTextArea(
      this._el.nativeElement,
      {
        lineNumbers: true,
        readOnly: true,
        mode: {name : 'strix', globalVars : true},
        lineWrapping : true
        //selectionPointer : "pointer",
      }
    );
    this.onInstanciated.emit(this.editor); // Expose the cm instance to the parent component
  }

  private defineCodeMirrorMode() {
    /*
      It's VERY important to realize that the code below runs at REAL TIME and
      DOESN'T have access to the angular data directly. It ONLY knows about the
      CURRENT LINE's text when doing the coloring. Therefore we prefixed each line
      with DOC_ID_PREFIX_LENGTH chars corresponding to the (frontend internal) index
      of the document and LINE_NUM_PREFIX_LENGTH chars with the line number (0-padded).
      These chars are HIDDEN from the user view and when the user copies text we trim the
      selection so that the prefixes are avoided. It's hacky but works very well so far.
      When we communicate with the angular data we currently need to go through
      window['CodeMirrorStrix']. Maybe there is a cleaner solution to that.
    */
    console.log("Defining CodeMirror mode.");
    CmDirective.definedCodeMirrorMode = true;
    CodeMirror.defineMode('strix', function(config, parserConfig) {
      return {
        startState : function() {
          return {
            currentWid : null,
            line : null,
            documentIndex : null
          };
        },
        token : function(stream, state) {
          const DOC_ID_PREFIX_LENGTH = 4;
          const LINE_NUM_PREFIX_LENGTH = 8;

          // In case of any whitespace – consume it all and return
          if (stream.eatSpace()) return "";

          // If we're here, there is no leading whitespace
          if (stream.sol()) {
            let lineNumberString = '';
            let documentIndexString = '';
            for (let i = 0; i < DOC_ID_PREFIX_LENGTH; i++) {
              documentIndexString += stream.next();
            }
            state.documentIndex = parseInt(documentIndexString);

            for (let i = 0; i < LINE_NUM_PREFIX_LENGTH; i++) {
              lineNumberString += stream.next();
            }
            let lineNumber = parseInt(lineNumberString);
            state.line = lineNumber;

            state.beginning = false;
            return 'variable-2';
          } else {
            let styles = [];

            if (state.currentWid === null) {
              state.currentWid = window['CodeMirrorStrix'][state.documentIndex].lines[state.line][0];
            }
            if (state.currentWid === undefined || state.currentWid === null) console.log("TOKEN PROBLEM.");
            let token = window['CodeMirrorStrix'][state.documentIndex].token_lookup[state.currentWid];
            if (token === undefined ) {
              stream.skipToEnd();
              state.line++;
              state.currentWid = null;
              return "hidden";
            }

            let tokenText = token.word;
            let tokenAnnotations = token.attrs;

            let newToken = '';
            while (! stream.eol()) {
              newToken += stream.next();
              if (newToken === tokenText) {
                state.currentWid++;
                break;
              }
            }

            if (tokenAnnotations.random === 'true') { // Just for testing
              styles.push('underlined');
            }

            let documentIndex = state.documentIndex;

            if (window['CodeMirrorStrixControl'][documentIndex].currentAnnotationType) {
              let currentAnnotationType: string = window['CodeMirrorStrixControl'][documentIndex].currentAnnotationType;
              let currentAnnotationValue: string = window['CodeMirrorStrixControl'][documentIndex].currentAnnotationValue;
              let currentAnnotationDatatype: string = window['CodeMirrorStrixControl'][documentIndex].currentAnnotationDatatype;

              if (currentAnnotationDatatype === "default") {
                if (tokenAnnotations[currentAnnotationType] === currentAnnotationValue) { // TODO: Value is always string?
                  styles.push('underlined');
                }
              } else if (currentAnnotationDatatype === "set") {
                for (let item of tokenAnnotations[currentAnnotationType]) {
                  if (item === currentAnnotationValue) {
                    styles.push('underlined');
                    break;
                  }
                }
              }
              
            }

            // Workaround for a disturbing codemirror behavior that joins segments that aren't whitespace–
            // separated with the preceeding segment if the style is the same. We don't want that
            // because it may cause flickering and sometimes even causes the text to reflow!
            var dummyStyle = state.currentWid % 2 === 0 ? "even" : "odd";
            styles.push(dummyStyle);

            return styles.join(' ');
          }
        }
      };

    });
  }

}
