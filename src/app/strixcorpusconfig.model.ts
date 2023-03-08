import { LangPhrase } from './loc.model';

export class StrixCorpusConfig {
  constructor(
    public corpusID: string,
    public textAttributes: any[],
    public wordAttributes: any[], // Should maybe be explicit ({"name" : string, "nodeName" : string, "set" : boolean})
    public structAttributes: any[],
    public description: LangPhrase,
    public name: LangPhrase,
    public mode: string,
    public protectedX: boolean,
    public folderName: string,
    public tokenInCorpora: number,
    public modeID : string,
    public docInCorpora: number
  ) {}
}
