export class StrixCorpusConfig {
  constructor(
    public corpusID: string,
    public textAttributes: any[],
    public wordAttributes: any[], // Should maybe be explicit ({"name" : string, "nodeName" : string, "set" : boolean})
    public structAttributes: any[], // TODO Separate classes for when it iss any[] and when it is object.
    public description: {[lang: string]: string}, // TODO Name this type
    public name: {[lang: string]: string}
  ) {}
}
