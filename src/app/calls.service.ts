import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import * as _ from 'lodash';

import { StrixDocument } from './strixdocument.model';
import { StrixResult } from './strixresult.model';
import { StrixQuery } from './strixquery.model';
import { StrixCorpusConfig } from './strixcorpusconfig.model';
import { LocService } from './loc.service';

@Injectable()
export class CallsService {

  private readonly STRIXBACKEND_URL = "https://ws.spraakbanken.gu.se/ws/strixlabb";
  //private readonly STRIXBACKEND_URL = "http://130.241.42.205:5000";
  //private readonly STRIXBACKEND_URL = "https://ws.spraakbanken.gu.se/ws/strixlabb/";
  //private readonly STRIXBACKEND_URL = "http://localhost:8080";

  constructor(private http : Http, private locService : LocService) { }

  /* public getCorpora() : Observable<string[]> {
    let url = `${this.STRIXBACKEND_URL}/config`;
    return this.http.get(url)
                    .map( (res: Response) => {
                      let corpora : string[] = res.json()
                      // TODO: Handle the LB corpora in a different way:
                      corpora = _.filter(corpora, (corpusID) => ! _.startsWith(corpusID, "littb"));
                      return corpora;
                    }).catch(this.handleError);
  } */

  // config
  public getCorpusInfo() : Observable<{ [key: string] : StrixCorpusConfig}> {
    let url = `${this.STRIXBACKEND_URL}/config`;
    return this.http.get(url)
      .map((res: Response) => {
        let data = res.json();
        console.log("getCorpusInfo data", data)

        let strixCorpusConfigs: { [key: string] : StrixCorpusConfig} = {};
        this.extractLocalizationKeys(data)
        for (let corpusID in data) {
          let corpusConfig = new StrixCorpusConfig();
          corpusConfig.corpusID = corpusID;
          let corpusData = data[corpusID];
          corpusConfig.textAttributes = corpusData.attributes.text_attributes;
          corpusConfig.wordAttributes = corpusData.attributes.word_attributes;
          corpusConfig.structAttributes = corpusData.attributes.struct_attributes;
          corpusConfig.description = corpusData.description;
          corpusConfig.name = corpusData.name;
          strixCorpusConfigs[corpusID] = corpusConfig;


        }
        return strixCorpusConfigs;

      }).catch(this.handleError);
  }

  private extractLocalizationKeys(config) {
    for (let corpusID in config) {
      let corpusData = config[corpusID];
      
      let updateObj = _.mapValues(corpusData.name, (name) => {
         return _.fromPairs([[corpusID, name]])
      })
      this.locService.updateDictionary(updateObj)


        // TODO: we might need to namespace these or it could get crowded...
      this.defaultAttrParse(corpusData.attributes.text_attributes)
      this.defaultAttrParse(corpusData.attributes.word_attributes)
      // this.defaultAttrParse(_.values(corpusData.attributes.struct_attributes))
    }

  }
  private defaultAttrParse(attrObj) {
    for(let obj of attrObj) {
      let updateObj = _.mapValues(obj.translation_name, (transationStr) => {
        let o = {}
        o[obj.name] = transationStr
        return o
      })
      this.locService.updateDictionary(updateObj)
    }
  }



  /*

  public getCorpusInfo(corpusIDs: string[]) : Observable<StrixCorpusConfig[]> {
  let url = `${this.STRIXBACKEND_URL}/config/${corpusIDs.join(",")}`;
  return this.http.get(url)
                  .map((res: Response) => {
                    let data = res.json();

                    let strixCorpusConfigs : StrixCorpusConfig[] = [];

                    for (let corpusID of corpusIDs) {
                      let corpusConfig = new StrixCorpusConfig();
                      corpusConfig.corpusID = corpusID;
                      let corpusData = data[corpusID];
                      corpusConfig.textAttributes = corpusData.attributes.text_attributes;
                      corpusConfig.wordAttributes = corpusData.attributes.word_attributes;
                      corpusConfig.structAttributes = corpusData.attributes.struct_attributes;
                      corpusConfig.description = corpusData.description;
                      corpusConfig.name = corpusData.name;
                      strixCorpusConfigs.push(corpusConfig);
                    }

                    return strixCorpusConfigs;

                  }).catch(this.handleError);
  }

  */

  private formatFilterObject(filters: any[]): string {
    for (let filter of filters) {
      if (filter.field === "datefrom") {
        // Rewrite years to full dates, currently required by the backend (and converts to strings as well!)
        filter.value.range.lte = filter.value.range.lte + "1231";
        filter.value.range.gte = filter.value.range.gte + "0101";
      }
      
      // filterStrings.push(`"${filter.field}":${JSON.stringify(value)}`);
    }
    let fieldGroups = _.groupBy(filters, "field")
    return JSON.stringify(_.mapValues(fieldGroups, (list) => _.map(list, "value")))
    // return "{" + filterStrings.join(",") + "}";
  }

  // search
  public searchForString(query: StrixQuery) : Observable<StrixResult> {
    console.log("searchForString", query);
    //let corpusIDs = query.corpora;
    let corpusIDs = [];

    /* temporary fix */
    let filters = []

    for (let filter of query.filters) {
      if (filter.field === "corpus_id") {
        corpusIDs.push(filter.value);
      } else {
        filters.push(filter)
      }
    }

    let searchString = query.queryString;
    if (searchString === null) {
      searchString = ""
    }
    let fromPage = (query.pageIndex - 1) * query.documentsPerPage;
    let toPage = (query.pageIndex) * query.documentsPerPage;
    let url = `${this.STRIXBACKEND_URL}/search`;
    // let paramsString = `exclude=lines,dump,token_lookup&from=${fromPage}&to=${toPage}&simple_highlight=true${corporaPart}&text_query=${searchString}`;
    let params = new URLSearchParams()

    if(corpusIDs && corpusIDs.length > 0) {
      params.set("corpora", corpusIDs.join(","))  
    }

    params.set("exclude", 'lines,dump,token_lookup')
    params.set("from", fromPage.toString())
    params.set("to", toPage.toString())
    params.set("simple_highlight", String(true))
    params.set("text_query", searchString)

    if (filters && _.size(filters) > 0) {
      params.set("text_filter", this.formatFilterObject(filters))
    }
    if(query.keyword_search) {
      params.set("in_order", (!query.keyword_search).toString())
    }
    let options = new RequestOptions({
      search : params
    });
    return this.http.get(url, options)
                    .map(this.preprocessResult)
                    .catch(this.handleError);
  }

  /* Get aggregations for faceted search */
  public getAggregations(query: StrixQuery) {
    console.log("getAggregations", query);
    //let corpusIDs = query.corpora;
    let corpusIDs = [];

    /* temporary fix */
    let filters = []
    for (let filter of query.filters) {
      if (filter.field === "corpus_id") {
        corpusIDs.push(filter.value);
      } else {
        filters.push(filter);
      }
    }
    console.log("filters", filters);


    let searchString = query.queryString;
    if (searchString === null) {
      searchString = ""
    }
    let fromPage = (query.pageIndex - 1) * query.documentsPerPage;
    let toPage = (query.pageIndex) * query.documentsPerPage;
    let url = `${this.STRIXBACKEND_URL}/aggs`;
    let corporaPart = (corpusIDs && corpusIDs.length > 0) ? `corpora=${corpusIDs.join(",")}` : "";
    let params = new URLSearchParams()
    params.set("facet_count", '5')

    if(corpusIDs && corpusIDs.length > 0) {
      params.set("corpora", corpusIDs.join(","))  
    }

    if (searchString.length !== 0) {
      params.set('text_query', searchString)
    }
    if (filters && _.size(filters) > 0) {
      params.set('text_filter', this.formatFilterObject(filters))
    }
    if(query.include_facets.length) {
      params.set("include_facets", query.include_facets.join(","))
    }
    if(query.keyword_search) {
      params.set("in_order", (!query.keyword_search).toString())
    }
    let options = new RequestOptions({
      search : params
    });
    return this.http.get(url, options)
                    .map(this.preprocessResult)
                    .catch(this.handleError);
  }

  public searchForAnnotation(corpus: string, annotationKey: string, annotationValue: string): Observable<StrixResult> {
    //let url = `${this.STRIXBACKEND_URL}/search/${corpus}/${annotationKey}/${annotationValue}`;
    let url = `${this.STRIXBACKEND_URL}/search`;
    console.log('url', url);
    let paramsString = `text_filter={"${annotationKey}" : "${annotationValue}"}`;
    let options = new RequestOptions({
      search : new URLSearchParams(paramsString)
    });
    return this.http.get(url, options)
                    .map(this.preprocessResult)
                    .catch(this.handleError);
  }

  /* ------------------ Calls for searching in ONE document only ------------------ */
  public searchDocumentForAnnotation(callObj: any): Observable<any> {
    console.log("searchDocumentForAnnotation()");
    //let url = `${this.STRIXBACKEND_URL}/search/${callObj.corpusID}/${callObj.elasticID}/${callObj.annotationKey}/${callObj.annotationValue}`;
    let url = `${this.STRIXBACKEND_URL}/search/${callObj.corpusID}/${callObj.elasticID}`;
    let paramsString = `text_query_field=${callObj.annotationKey}&text_query=${callObj.annotationValue}&exclude=*&size=1&current_position=${callObj.currentPosition}&forward=${!callObj.backwards}`;
    let options = new RequestOptions({
      search: new URLSearchParams(paramsString)
    });
    return this.http.get(url, options)
                    .map((res) => res.json())
                    .catch(this.handleError);
  }

  public getDocument(documentID: string, corpusID: string) : Observable<StrixDocument> {
    console.log("getDocument()");
    let url = `${this.STRIXBACKEND_URL}/document/${corpusID}/${documentID}`;
    console.log('url', url);
    return this.http.get(url)
                    .map(this.extractDocumentData)
                    .catch(this.handleError);
  }
  public getDocumentBySentenceID(corpusID: string, sentenceID: string) : Observable<StrixDocument> {
    let url = `${this.STRIXBACKEND_URL}/document/${corpusID}/sentence/${sentenceID}`;
    return this.http.get(url)
                    .map(this.extractDocumentData)
                    .catch(this.handleError);
  }

  public getDocumentWithQuery(documentID: string, corpusID: string, query: string, inOrder: boolean = true): Observable<StrixDocument> {
    console.log("getDocumentWithQuery()");
    //let url = `${this.STRIXBACKEND_URL}/search/${corpusID}/doc_id/${documentID}/${query}`;
    let url = `${this.STRIXBACKEND_URL}/search/${corpusID}/${documentID}`;
    console.log('url', url);
    let paramsString = `simple_highlight=false&token_lookup_from=${0}&token_lookup_to=${1000}&text_query=${query}`;
    if (!inOrder) {
      paramsString += `&in_order=false`;
    }
    let options = new RequestOptions({
      search: new URLSearchParams(paramsString)
    });
    return this.http.get(url, options)
                    .map(this.extractDocumentData)
                    .catch(this.handleError);
  }

  public getTokenDataFromDocument(documentID: string, corpusID: string, start: number, end: number) {
    console.log("getTokenDataFromDocument()");
    end++; // Because the API expects python style slicing indices
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
    strixResult.count = body.hits;
    strixResult.data = body.data;
    strixResult.aggregations = body.aggregations;
    strixResult.unused_facets = body.unused_facets;
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
    strixDocument.word_count = data.word_count;
    // Temporary until backend fix ----
    if (strixDocument.lines[strixDocument.lines.length-1].length === 1) {
      strixDocument.lines[strixDocument.lines.length-1].push(strixDocument.lines[strixDocument.lines.length-1][0]);
    }
    // --------------------------------
    strixDocument.dump = data.dump;
    strixDocument.token_lookup = data.token_lookup;
    strixDocument.corpusID = data.corpus_id;
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
  public getRelatedDocuments(documentID: string, corpusID: string): Observable<StrixDocument> {
    let url = `${this.STRIXBACKEND_URL}/related/${corpusID}/${documentID}`;
    console.log('url', url);
    let paramsString = `exclude=token_lookup,dump,lines`;
    let options = new RequestOptions({
      search: new URLSearchParams(paramsString)
    });
    return this.http.get(url, options)
                    .map(this.preprocessResult)
                    .catch(this.handleError);
  }

  /* get data for Date Histogram */
  public getDateHistogramData(corpusID: string): Observable<StrixDocument> {
    let url = `${this.STRIXBACKEND_URL}/date_histogram/${corpusID}/year`;
    console.log('url', url);
    let paramsString = `date_field=datefrom`;
    let options = new RequestOptions({
      search: new URLSearchParams(paramsString)
    });
    return this.http.get(url, options)
                    .map(this.extractTokenData) // Rename this to extractData?
                    .catch(this.handleError);
  }

  /* Get annotations values */
  public getValuesForAnnotation(corpusID: string, documentID, annotationName: string) {
    let url = `${this.STRIXBACKEND_URL}/aggs/${corpusID}/${documentID}/${annotationName}`;
    return this.http.get(url)
                    .map(this.extractTokenData)
                    .catch(this.handleError);
  }

}
