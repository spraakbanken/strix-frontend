import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { StrixDocument } from './strixdocument.model';
import { StrixResult } from './strixresult.model';
import { StrixQuery } from './strixquery.model';
import { StrixCorpusConfig } from './strixcorpusconfig.model';
import * as _ from 'lodash';

@Injectable()
export class CallsService {

  private readonly STRIXBACKEND_URL = "https://ws.spraakbanken.gu.se/ws/strixlabb/";

  constructor(private http : Http) { }

  public getCorpora() : Observable<string[]> {
    let url = `${this.STRIXBACKEND_URL}/config`;
    return this.http.get(url)
                    .map( (res: Response) => {
                      let corpora : string[] = res.json()
                      // TODO: Handle the LB corpora in a different way:
                      corpora = _.filter(corpora, (corpusID) => ! _.startsWith(corpusID, "littb"));
                      return corpora;
                    }).catch(this.handleError);
  }

  public getCorpusInfo(corpusIDs: string[]) : Observable<StrixCorpusConfig[]> {
    let url = `${this.STRIXBACKEND_URL}/config/${corpusIDs.join(",")}`;
    return this.http.get(url)
                    .map((res: Response) => {
                      let data = res.json();

                      let strixCorpusConfigs : StrixCorpusConfig[] = [];

                      for (let corpus of corpusIDs) {
                        let corpusConfig = new StrixCorpusConfig();
                        corpusConfig.corpusID = corpus;
                        corpusConfig.textAttributes = data[corpus].text_attributes;
                        corpusConfig.wordAttributes = data[corpus].word_attributes;
                        strixCorpusConfigs.push(corpusConfig);
                      }

                      return strixCorpusConfigs;

                    }).catch(this.handleError);
  }

  public searchForString(query: StrixQuery) : Observable<StrixResult> {
    let corpusIDs = query.corpora;
    let searchString = query.queryString;
    let fromPage = (query.pageIndex - 1) * query.documentsPerPage;
    let toPage = (query.pageIndex) * query.documentsPerPage;
    let url = `${this.STRIXBACKEND_URL}/search/${corpusIDs.join(",")}/${searchString}`;
    console.log('url', url);
    let paramsString = `exclude=lines,dump,token_lookup&from=${fromPage}&to=${toPage}&simple_highlight=true`;
    let options = new RequestOptions({
      search: new URLSearchParams(paramsString)
    });
    return this.http.get(url, options)
                    .map(this.preprocessResult)
                    .catch(this.handleError);
  }

  public searchForAnnotation(corpus: string, annotationKey: string, annotationValue: string) : Observable<StrixResult> {
    let url = `${this.STRIXBACKEND_URL}/search/${corpus}/${annotationKey}/${annotationValue}`;
    console.log('url', url);
    return this.http.get(url)
                    .map(this.preprocessResult)
                    .catch(this.handleError);
  }

  /* ------------------ Calls for searching in ONE document only ------------------ */
  public searchDocumentForAnnotation(callObj: any): Observable<any> {
    let url = `${this.STRIXBACKEND_URL}/search/${callObj.corpusID}/doc_id/${callObj.elasticID}/${callObj.annotationKey}/${callObj.annotationValue}`;
    let paramsString = `exclude=*&size=1&current_position=${callObj.currentPosition}&forward=${!callObj.backwards}`;
    let options = new RequestOptions({
      search: new URLSearchParams(paramsString)
    });
    return this.http.get(url, options)
                    .map((res) => res.json())
                    .catch(this.handleError);
  }

  public getDocument(documentID: string, corpusID: string) : Observable<StrixDocument> {
    let url = `${this.STRIXBACKEND_URL}/document/${corpusID}/${documentID}`;
    console.log('url', url);
    return this.http.get(url)
                    .map(this.extractDocumentData)
                    .catch(this.handleError);
  }

  public getDocumentWithQuery(documentID: string, corpusID: string, query: string) : Observable<StrixDocument> {
    let url = `${this.STRIXBACKEND_URL}/search/${corpusID}/doc_id/${documentID}/${query}`;
    console.log('url', url);
    let paramsString = `simple_highlight=false&token_lookup_from=${0}&token_lookup_to=${1000}`;
    let options = new RequestOptions({
      search: new URLSearchParams(paramsString)
    });
    return this.http.get(url, options)
                    .map(this.extractDocumentData)
                    .catch(this.handleError);
  }

  public getTokenDataFromDocument(documentID: string, corpusID: string, start: number, end: number) {
    //console.log("running getTokenDataFromDocument");
    let url = `${this.STRIXBACKEND_URL}/document/${corpusID}/${documentID}`;
    let paramsString = `include=token_lookup&token_lookup_from=${start}&token_lookup_to=${end}`;
    let options = new RequestOptions({
      search: new URLSearchParams(paramsString)
    });
    return this.http.get(url, options)
                    .map(this.extractTokenData)
                    .catch(this.handleError);
  }

  private preprocessResult(res: Response) : StrixResult {
    let strixResult = new StrixResult();
    console.log("res", res);
    let body = res.json();
    //console.log("body", body);
    strixResult.count = body.hits;
    strixResult.data = body.data;
    return strixResult;
  }

  private extractDocumentData(res: Response): StrixDocument { // TODO: Update this
    let body = res.json();
    console.log('body', body);
    let strixDocument = new StrixDocument();
    let data = body.data || body; // Necessary now because the 'search' and 'document' data give different results (?)
    strixDocument.doc_id = data.doc_id;
    strixDocument.title = data.title;
    strixDocument.textAttributes = data.text_attributes;
    strixDocument.lines = data.lines;
    strixDocument.dump = data.dump;
    strixDocument.token_lookup = data.token_lookup;
    strixDocument.corpusID = data.corpus;
    strixDocument.highlight = data.highlight;
    return strixDocument;
  }

  private extractTokenData(res: Response): any {
    let body = res.json();
    console.log('body', body);
    return body;
  }

  private handleError(error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    return Observable.throw(errMsg);
  }

  /* Related documents */
  public getRelatedDocuments(documentID: string, corpusID: string) : Observable<StrixDocument> {
    let url = `${this.STRIXBACKEND_URL}/related/${corpusID}/text/${documentID}`;
    console.log('url', url);
    let paramsString = `exclude=token_lookup,dump,lines`;
    let options = new RequestOptions({
      search: new URLSearchParams(paramsString)
    });
    return this.http.get(url, options)
                    .map(this.preprocessResult)
                    .catch(this.handleError);
  }

}
