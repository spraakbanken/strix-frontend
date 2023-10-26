import { Directive, ElementRef, EventEmitter, Output } from '@angular/core';
import * as CodeMirror from 'codemirror';
import * as _ from 'lodash';

@Directive({
  selector: '[cmp]'
})
export class CmpDirective {
  @Output() onInstanciatedP = new EventEmitter<any>();

  editor: any;
  static definedCodeMirrorModeP = false;

  constructor(private _el: ElementRef) {
    if (! CmpDirective.definedCodeMirrorModeP ) this.defineCodeMirrorMode();
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
    this.onInstanciatedP.emit(this.editor); // Expose the cm instance to the parent component
  }

  private defineCodeMirrorMode() {
    /*
      It's VERY important to realize that the code below runs at REAL TIME and
      DOESN'T have access to the angular or cm data directly. It ONLY knows about the
      CURRENT LINE's text when doing the coloring. Therefore we prefixed each line
      with DOC_ID_PREFIX_LENGTH chars corresponding to the (frontend internal) index
      of the document and LINE_NUM_PREFIX_LENGTH chars with the line number (0-padded).
      These chars are HIDDEN from the user view and when the user copies text we trim the
      selection so that the prefixes are avoided. It's hacky but works very well so far.
      When we communicate with the angular data we currently need to go through
      window['CodeMirrorStrix']. Maybe there is a cleaner solution to that.
    */
    // console.log("Defining CodeMirror mode.");
    CmpDirective.definedCodeMirrorModeP = true;
    CodeMirror.defineMode('strixP', function(config, parserConfig) {
      const speakers: string[] = [];
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
              state.currentWid = window['CodeMirrorStrixP'][state.documentIndex].lines[state.line][0];
            }
            if (state.currentWid === undefined || state.currentWid === null) console.log("TOKEN PROBLEM.");
            let token = window['CodeMirrorStrixP'][state.documentIndex].token_lookup[state.currentWid];
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

            if (window['CodeMirrorStrixControlP'][documentIndex].currentAnnotationType) {
              let currentAnnotationType: string = window['CodeMirrorStrixControlP'][documentIndex].currentAnnotationType;
              let currentAnnotationStructuralType: string = window['CodeMirrorStrixControlP'][documentIndex].currentAnnotationStructuralType;
              let currentAnnotationValue: string = window['CodeMirrorStrixControlP'][documentIndex].currentAnnotationValue;
              let currentAnnotationDatatype: string = window['CodeMirrorStrixControlP'][documentIndex].currentAnnotationDatatype;

              if (currentAnnotationDatatype === "default") {
                if (tokenAnnotations[currentAnnotationType] === currentAnnotationValue) { // TODO: Value is always string?
                  styles.push('underlined');
                } else if (currentAnnotationStructuralType && tokenAnnotations[currentAnnotationStructuralType] && tokenAnnotations[currentAnnotationStructuralType].attrs[currentAnnotationType] === currentAnnotationValue) {
                  // NOTE: This will collide if we can have structural annotation names that are the same as any other
                  // annotation name. Will this ever be the case?
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

            const speakerID = _.get(tokenAnnotations, ['sentence', 'attrs', 'speaker_id']);
            if (speakerID && !['comment', 'pause'].includes(speakerID)) {
              if (!speakers.includes(speakerID)) speakers.push(speakerID);
              styles.push('annotation-' + speakers.indexOf(speakerID));
            }

            // Workaround for a disturbing codemirror behavior that joins segments that aren't whitespace–
            // separated with the preceeding segment if the style is the same. We don't want that
            // because it may cause flickering and sometimes even causes the text to reflow!
            styles.push(state.currentWid % 2 ? "even" : "odd");

            return styles.join(' ');
          }
        }
      };

    });
  }

}
