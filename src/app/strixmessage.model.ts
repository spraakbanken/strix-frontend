/**
 * This class should probably be called something else,
 * since its only purpuse is for telling the GUI that
 * a new document had been properly loaded.
 */

export class StrixMessage {

  constructor(public documentIndex: number,
              public openInNew: boolean) {}
}