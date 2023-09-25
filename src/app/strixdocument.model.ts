export class StrixDocument {
  dump: string[];
  lines: number[][];
  token_lookup: any;
  textAttributes: any;
  doc_id: string;
  title: string;
  corpusID: string;
  highlight: any;
  word_count: number;
  preview: string;
  mostCommonWords: string;

  // Internal index for the frontend to keep track of.
  // It never changes after it's loaded, but it may
  // change if the document is closed and reopened.
  index : number; 


  public getTokenID(row : number, char : number) : number {
    // Get the wid of the first token of the line
    let widCounter : number = this.lines[row][0];
    if (widCounter !== -1) {
      // Get the real text line as displayed to the user
      let line = this.dump[row].slice(12); // TODO: Get rid of magic number
      // Consume each token until the current char-index has been reached
      //console.log("passed first guard", line);
      // console.log("widCounter", widCounter, char);
      let charsConsumed = 0;
      while (charsConsumed <= char) {
        // Consume all whitespace:
        while ( /^\s+$/.test(line[charsConsumed]) ) {
          charsConsumed++;
        }
        // Consume the next token
        let token = this.token_lookup[widCounter];
        // console.log("consuming token", token, this.token_lookup, widCounter);
        if (! token) { // Think this over...
          return -1;
        }
        let tokenText = token.word;
        charsConsumed += tokenText.length;
        widCounter++;
      }
      return widCounter - 1;
    } else {
      return -1;
    }
  }

  /* Returns an object with the head and anchor of the token. */
  public getTokenBounds(tokenID: number) : any {
    // Get the line number of the token
    // TODO: This could be speeded up with a binary search!
    let lineNumber = -1;
    for (let i = 0; i < this.lines.length; i++) {
      if (tokenID >= this.lines[i][0] && tokenID <= this.lines[i][1]) {
        lineNumber = i;
        break;
      }
    }
    // Calculate the distance to the token from the start of the line
    let line = this.dump[lineNumber].slice(12); // TODO: Get rid of magic number
    let firstTokenOfLine = this.lines[lineNumber][0];
    // Consume each token until the current token-index has been reached
    let charsConsumed = 0;
    let currentToken = firstTokenOfLine;
    while (currentToken < tokenID) {
      // Consume all whitespace:
      while ( /^\s$/.test(line[charsConsumed]) ) {
        charsConsumed++;
      }
      // Consume the next token
      let token = this.token_lookup[currentToken];
      let tokenText = token.word;
      charsConsumed += tokenText.length;
      currentToken++;
    }
    // Consume trailing whitespace
    while ( /^\s$/.test(line[charsConsumed]) ) {
      charsConsumed++;
    }

    charsConsumed += 12; // TODO: Get rid of magic number
    

    return {
      "anchor" : {"line" : lineNumber, "ch" : charsConsumed},
      //"head" : {"line" : lineNumber, "ch" : charsConsumed + this.token_lookup[tokenID].word.length - 1}
      "head" : {"line" : lineNumber, "ch" : charsConsumed + this.token_lookup[tokenID].word.length}
    };
  }

  public getFirstTokenFromLine(line: number) {
    // We need to account for the fact that this.lines can have [-1] on empty lines with no tokens
    // We then extend the interval to the first line above with a token

    let firstToken = -1;
    let offset = 0;

    // console.log("fline|", line, this.lines, this.lines.length);
    
    if (line < this.lines.length) {
      while (firstToken === -1) {
        if (line - offset <= 0) {
          firstToken = 0;
        } else {
          firstToken = this.lines[line-offset][0];
          offset++;
        }
        /* if (line - offset <= 0) firstToken = 0; */
      }
      return firstToken;
    } else {
      return -1;
    }
  }

  public getLastTokenFromDocument() {
    /* The last line can be an empty line (-1) so we need to continue backwards until we have a non empty line. */
    /* let lastToken = -1;
    let lineNumber = this.lines.length - 1;
    while( lastToken === -1 ) {
      if (this.lines[lineNumber].length === 2) {
        lastToken = this.lines[lineNumber][1];
      }
      lineNumber--;
    }
    return lastToken;
    */
    return this.word_count;
  }

  public getLastTokenFromLine(line: number) {
    // We need to account for the fact that this.lines can have [-1] on empty lines with no tokens
    // We then extend the interval to the first line line below with a token
    
    let lastToken = -1;
    let offset = 0;

    // console.log("line|", line, this.lines, this.lines.length);
    
    if (line < this.lines.length) {
      while (lastToken === -1) {
        /* if (! this.lines[line+offset]) {
          lastToken = 
          break;
        } */
        if (this.lines[line+offset]) {
          if (this.lines[line+offset].length === 2) {
            lastToken = this.lines[line+offset][1];
          }
          offset++;
        } else {
          break;
        }
        /* if (line + offset > this.lines.length) {
          lastToken = 0;
        } */
        // TODO: What happens in the event of an empty line at the end. Is it even possible?
      }

      return lastToken;
    } else {
      return -1;
    }

  }

}
