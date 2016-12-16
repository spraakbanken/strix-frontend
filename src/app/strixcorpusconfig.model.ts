export class StrixCorpusConfig {
    corpusID : string;
    textAttributes : string[];
    wordAttributes : any[]; // Should maybe be explicit ({"name" : string, "nodeName" : string, "set" : boolean})
}