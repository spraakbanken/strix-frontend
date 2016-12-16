export class StrixDocument {
  dump: string[];
  lines: number[];
  token_lookup: any;
  textAttributes: any;
  doc_id: string;
  title: string;
  corpusID: string;
  highlight: any;

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
      let charsConsumed = 0;
      while (charsConsumed <= char) {
        // Consume all whitespace:
        while ( /^\s+$/.test(line[charsConsumed]) ) {
          charsConsumed++;
        }
        // Consume the next token
        let token = this.token_lookup[widCounter];
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
    console.log("first token of line", firstTokenOfLine, this.token_lookup[firstTokenOfLine].word);
    // Consume each token until the current token-index has been reached
    let charsConsumed = 0;
    let currentToken = firstTokenOfLine;
    while (currentToken < tokenID) {
      // Consume all whitespace:
      while ( /^\s$/.test(line[charsConsumed]) ) {
        console.log("ate whitespace char.");
        charsConsumed++;
      }
      // Consume the next token
      let token = this.token_lookup[currentToken];
      let tokenText = token.word;
      charsConsumed += tokenText.length;
      console.log("consumed", tokenText);
      currentToken++;
    }
    // Consume trailing whitespace
    while ( /^\s$/.test(line[charsConsumed]) ) {
      console.log("ate whitespace char.");
      charsConsumed++;
    }

    charsConsumed += 12; // TODO: Get rid of magic number
    

    return {
      "anchor" : {"line" : lineNumber, "ch" : charsConsumed},
      "head" : {"line" : lineNumber, "ch" : charsConsumed + this.token_lookup[tokenID].word.length}
    };
  }

}