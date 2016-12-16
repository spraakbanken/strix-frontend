import { Directive, Output, Input, EventEmitter, ElementRef } from '@angular/core';
import * as CodeMirror from 'codemirror';

@Directive({
  selector: '[cm]'
})
export class CmDirective {
  @Output() onInstanciated = new EventEmitter<any>();

  editor: any;

  constructor(private _el: ElementRef) {
    // TODO: This should only be done once, so we have to check for it in some way.
    this.defineCodeMirrorMode();
  }

  ngAfterViewInit() {
    this.editor = CodeMirror.fromTextArea(
      this._el.nativeElement,
      {
        lineNumbers: true,
        readOnly: true,
        mode: {name: 'strix', globalVars: true},
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
      We then communicate with the angular data we currently need to go through
      window['CodeMirrorStrix']. Maybe there is a cleaner solution to that.
    */
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
            let styles = []

            if (state.currentWid === null) {
              state.currentWid = window['CodeMirrorStrix'][state.documentIndex].lines[state.line][0];
            }
            let token = window['CodeMirrorStrix'][state.documentIndex].token_lookup[state.currentWid];

            if (! token) { // Temporary because the BE only returns 10 now.
              stream.next();
              return "";
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

            if (tokenAnnotations.random === 'true') {
              styles.push('underlined');
            }

            let documentIndex = state.documentIndex;
            console.log("documentIndex", documentIndex);

            if (window['CodeMirrorStrixControl'][documentIndex].currentAnnotationType) {
              let currentAnnotationType : string = window['CodeMirrorStrixControl'][documentIndex].currentAnnotationType;
              let currentAnnotationValue : string = window['CodeMirrorStrixControl'][documentIndex].currentAnnotationValue;

              if (tokenAnnotations[currentAnnotationType] === currentAnnotationValue) { // TODO: Value is always string?
                styles.push('underlined');
              }
            }

            return styles.join(' ');
          }
        }
      };

    });
  }

}
