export class SearchQuery {
  constructor(
    public annotationKey: string,
    public annotationValue: string,
    public currentPosition: number,
    public forward: boolean
  ) { }
}