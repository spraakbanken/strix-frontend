export class StrixCorpusConfig {
    corpusID : string;
    textAttributes : any[];
    wordAttributes : any[]; // Should maybe be explicit ({"name" : string, "nodeName" : string, "set" : boolean})
    structAttributes : any[];
    description: any; // Object where each key is a language code and the value is the descripton as a string
    name: any; // Object where each key is a language code and the value is the name as a string
}