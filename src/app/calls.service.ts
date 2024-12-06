import { Injectable } from '@angular/core';
import { HttpHeaders, HttpParams, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import * as _ from 'lodash';

import { StrixDocument } from './strixdocument.model';
import { SearchResult, AggregationsResult } from './strixresult.model';
import { Filter, StrixQuery } from './strixquery.model';
import { StrixCorpusConfig } from './strixcorpusconfig.model';
import { LocService } from './loc.service';
import { environment } from '../environments/environment';
import { SearchQuery } from './strixsearchquery.model';

@Injectable()
export class CallsService {

  private readonly STRIXBACKEND_URL = environment.api
  private readonly AUTH_URL = environment.auth
  //private readonly STRIXBACKEND_URL = "http://130.241.42.205:5000";
  //private readonly STRIXBACKEND_URL = "https://ws.spraakbanken.gu.se/ws/strixlabb/";
  //private readonly STRIXBACKEND_URL = "http://localhost:8080";

  constructor(private http: HttpClient, private locService: LocService) { }

  /* IMPORTANT: we need to put the jwt on the window object since the calls service object used
    in the application init section isn't the same as the one injected in the bootstrapped app. */
  public testForLogin(): Observable<boolean> {
    let url = this.AUTH_URL + '/jwt';
    return this.http.get(url, {responseType : 'text', withCredentials : true}).pipe(
      map(jwt => {
        // console.log('JWT', jwt);
        window['jwt'] = jwt;
        return true;
      }),
      catchError((error: HttpErrorResponse) =>
        // "403 Forbidden" is fine, not an error.
        error.status === 403 ? of(false) : this.handleError(error)
      )
    );
  }

  /**
   * Customized GET call for Strix backend.
   */
  private get<T>(endpoint: string, params?: {[param: string]: string}) {
    // console.log('GET Request', endpoint, params);
    // const x = data ->  console.log('GET Response', endpoint, params, data)
    const options = {
      params : new HttpParams({fromObject : params}),
      headers : window['jwt'] ? new HttpHeaders({'Authorization' : `Bearer ${window['jwt']}`}) : null,
    };
    return this.http.get<T>(this.STRIXBACKEND_URL + '/' + endpoint, options)
      .pipe(tap(data => {const x = data}));
  }

  public getCorpusInfo(): Observable<{[key: string]: StrixCorpusConfig}> {
    return this.get<StrixCorpusConfig>('config').pipe(
      map(data => {
        // console.log("getCorpusInfo data", data, window["jwt"])

        // BE returns struct_attributes as an object; convert it to an array.
        for (let corpusID in data) {
          data[corpusID].attributes.struct_attributes = _.values(_.mapValues(
            data[corpusID].attributes.struct_attributes,
            (attr, name) => ({...attr, name: name})
          ));
        }

        this.extractLocalizationKeys(data);
        return _.mapValues(data, (corpusData: any, corpusID) => new StrixCorpusConfig(
          corpusID,
          corpusData.attributes.text_attributes,
          corpusData.attributes.word_attributes,
          corpusData.attributes.struct_attributes,
          corpusData.description,
          corpusData.name,
          corpusData.mode,
          corpusData.protected,
          corpusData.folder_name,
          corpusData.token_in_corpora,
          corpusData.mode_id,
          corpusData.doc_in_corpora
        ));

      }),
      catchError(this.handleError)
    );
  }

  private extractLocalizationKeys(config) {
    for (let corpusID in config) {
      let corpusData = config[corpusID];

      let updateObj: any = _.mapValues(corpusData.name, (name) => {
         return _.fromPairs([[corpusID, name]])
      })
      this.locService.updateDictionary(updateObj)


        // TODO: we might need to namespace these or it could get crowded...
      // text_ and word_attributes are arrays but struct_attributes is an object.
      this.defaultAttrParse(corpusData.attributes.text_attributes)
      this.defaultAttrParse(corpusData.attributes.word_attributes)
      this.defaultAttrParse(corpusData.attributes.struct_attributes)
    }

  }
  private defaultAttrParse(attrObj: any[]) {
    for(let obj of attrObj) {
      let updateObj: any = _.mapValues(obj.translation_name, (transationStr) => {
        let o = {}
        o[obj.name] = transationStr
        return o
      })
      this.locService.updateDictionary(updateObj)
    }
  }

  private formatFilterObject(filters: Filter[]): string {
    for (let filter of filters) {
      // console.log("filter", filter)
      if (filter.field === "datefrom") {
        // Rewrite years to full dates, currently required by the backend (and converts to strings as well!)
        filter.value.range.lte = filter.value.range.lte + "1231";
        filter.value.range.gte = filter.value.range.gte + "0101";
      }

      // filterStrings.push(`"${filter.field}":${JSON.stringify(value)}`);
    }

    function wrapValuesInArray(filters: Filter[]) {
      let fieldGroups = _.groupBy(filters, "field")
      return _.mapValues(fieldGroups, (list) => _.map(list, "value"))
    }
    let notRangeFilters = _.reject(filters, {type: "range"});
    let rangeFilters = _.filter(filters, {type: "range"});
    let output = wrapValuesInArray(notRangeFilters)
    let rangeObj = _.fromPairs(_.map(rangeFilters, (item) => [item.field, item.value]))

    return JSON.stringify(_.merge(output, rangeObj))
  }

  // search
  public searchForString(query: StrixQuery) : Observable<SearchResult> {
    let filters = _.cloneDeep(query.filters);
    let corpusIDs = <string[]>_.map(_.remove(filters, {field : 'corpus_id'}), 'value');

    let searchString = query.queryString;
    if (searchString === null) {
      searchString = ""
    }
    let fromPage = (query.pageIndex) * query.documentsPerPage;
    let toPage = (query.pageIndex + 1) * query.documentsPerPage;
    let params: any = {
      exclude : 'lines,dump,token_lookup',
      from : fromPage.toString(),
      to : toPage.toString(),
      simple_highlight : String(true),
      text_query : searchString,
    };

    if(corpusIDs && corpusIDs.length > 0) {
      params.corpora = corpusIDs.join(",");
    }
    params.text_filter = this.formatFilterObject(filters);
    if(query.keyword_search) {
      params.in_order = (!query.keyword_search).toString();
    }

    return this.get<SearchResult>('search', params).pipe(
      // Copy 'hits' to 'count'.
      map((res: any) => ({...res, count : res.hits})),
      catchError(this.handleError)
    );
  }

  /* Stats document list */
  public getStatDocuments(corpora: string[], query: string, filters, keyword_search: boolean, fromPage: number, toPage: number) : Observable<SearchResult> {
    let searchString = query;
    if (searchString === null) {
      searchString = ""
    }
    let params: any = {
      exclude : 'lines,dump,token_lookup',
      from : fromPage.toString(),
      to : toPage.toString(),
      simple_highlight : String(true),
      text_query : searchString,
    };
    if (corpora) {
      params.corpora = corpora.join(",");
    }
    let filterss = _.cloneDeep(filters);
    params.text_filter = this.formatFilterObject(filterss);
    if(keyword_search) {
      params.in_order = (!keyword_search).toString();
    }
    return this.get<SearchResult>('search', params).pipe(
      map((res: any) => ({...res, count : res.hits})),
      catchError(this.handleError)
    );
  }

  /* Get aggregations for faceted search */
  public getAggregations(query: StrixQuery): Observable<AggregationsResult> {
    // console.log("getAggregations", query);

    let filters = _.cloneDeep(query.filters);
    let corpusIDs = <string[]>_.map(_.remove(filters, {field : 'corpus_id'}), 'value');

    let searchString = query.queryString || '';
    let params: any = {
      facet_count : 5,
      exclude_empty_buckets : true,
    };

    // if(corpusIDs && corpusIDs.length > 0) {
    //   params.corpora = corpusIDs.join(",");
    // }

    if (query.corpora) {
      params.corpora = query.corpora.join(",")
    }

    if (searchString.length !== 0) {
      params.text_query = searchString;
    }
    if (filters && _.size(filters) > 0) {
      params.text_filter = this.formatFilterObject(filters);
    }
    if (query.include_facets.length) {
      params.include_facets = query.include_facets.join(",");
    }
    if (query.keyword_search) {
      params.in_order = (!query.keyword_search).toString();
    }
    if (query.modes) {
      params.modes = query.modes.join(',');
    }
    return this.get<AggregationsResult>('aggs', params).pipe(
      catchError(this.handleError)
    );
  }

  // public getStatistics(query: StrixQuery): Observable<any> {
  //   // query.filters.push.apply(query.filters, {"year": {"range": {"gte": 1904, "lte": 1920}}})
  //   let filters = _.cloneDeep(query.filters);
  //   let corpusIDs = <string[]>_.map(_.remove(filters, {field : 'corpus_id'}), 'value');

  //   let searchString = query.queryString || '';
  //   let params: any = {
  //     facet_count : 5,
  //     exclude_empty_buckets : true,
  //   };

  //   if(corpusIDs && corpusIDs.length > 0) {
  //     params.corpora = corpusIDs.join(",");
  //   }

  //   // if (query.corpora) {
  //   //   params.corpora = query.corpora.join(",")
  //   // }

  //   if (searchString.length !== 0) {
  //     params.text_query = searchString;
  //   }
  //   if (filters && _.size(filters) > 0) {
  //     params.text_filter = this.formatFilterObject(filters);
  //   }
  //   if (query.include_facets.length) {
  //     params.include_facets = query.include_facets.join(",");
  //   }
  //   if (query.keyword_search) {
  //     params.in_order = (!query.keyword_search).toString();
  //   }
  //   if (query.modes) {
  //     params.modes = query.modes.join(',');
  //   }
  //   return this.get<any>('stats', params).pipe(
  //     catchError(this.handleError)
  //   );
  // }

  public getDataforFacet(corpora: string[], modes: string[], include_facet: string, include_attr: string[], searchString: string, keyword_search: boolean) {
    let params: any = {};
    let get_filter = [];
    for (let item of include_attr) {
      get_filter.push({'field': include_facet, 'value': item})
    }
    if (get_filter && _.size(get_filter) > 0) {
      params.text_filter = this.formatFilterObject(get_filter);
    }

    if (searchString !== null && searchString.length !== 0) {
      params.text_query = searchString;
    }
    if(keyword_search) {
      params.in_order = (!keyword_search).toString();
    }

    if (corpora) {
      params.corpora = corpora.join(",");
    }
    if (modes) {
      params.modes = modes.join(",");
    }
    return this.get<any>('facet_data', params).pipe(
      catchError(this.handleError)
    );
  }

  public getFacetStatistics(corpora: string[], modes: string[], include_list: string[], query_search: string, keyword_search: boolean, filters) {
    let params: any = {};

    if (corpora) {
      params.corpora = corpora.join(",");
    }
    if (modes) {
      params.modes = modes.join(",");
    }
    if (query_search) {
      params.text_query = query_search;
    }
    if (filters && _.size(filters) > 0) {
      params.text_filter = this.formatFilterObject(filters);
    }
    if(keyword_search) {
      params.in_order = (!keyword_search).toString();
    }
    if (include_list.length) {
      params.include_facets = include_list.join(",");
    }
    return this.get<any>('aggs', params).pipe(
      catchError(this.handleError)
    );
  }

  public getGeoStatistics(corpora: string[], modes: string[], include_list: string[], query_search: string, keyword_search: boolean, filters) {
    let params: any = {};

    if (corpora) {
      params.corpora = corpora.join(",");
    }
    if (modes) {
      params.modes = modes.join(",");
    }
    if (query_search) {
      params.text_query = query_search;
    }
    if (filters && _.size(filters) > 0) {
      params.text_filter = this.formatFilterObject(filters);
    }
    if(keyword_search) {
      params.in_order = (!keyword_search).toString();
    }
    if (include_list.length) {
      params.include_facets = include_list.join(",");
    }
    return this.get<any>('geo_stats', params).pipe(
      catchError(this.handleError)
    );
  }

  public getInfoStrix() {
    let params: any = {};

    return this.get<any>('infoStrix', params).pipe(
      catchError(this.handleError)
    );
  }

  public getModeStatistics(corpora: string[], modes: string[]): Observable<any> {
    let params: any = {};

    if (corpora) {
      params.corpora = corpora.join(",");
    }
    if (modes) {
      params.modes = modes.join(",");
    }
    params.facet_count = 0;
    return this.get<any>('aggs', params).pipe(
      catchError(this.handleError)
    );
  }

  public getYearStatistics(corpora: string[], modes: string[]): Observable<any> {
    let params: any = {};

    if (corpora) {
      params.corpora = corpora.join(",");
    }
    if (modes) {
      params.modes = modes.join(",");
    }
    params.include_facets = "year";
    return this.get<any>('aggs', params).pipe(
      catchError(this.handleError)
    );
  }

  public getCorpusId(corpora: string[], modes: string[], yearInfo: string): Observable<any> {
    let params: any = {};

    if (corpora) {
      params.corpora = corpora.join(",");
    }
    if (modes) {
      params.modes = modes.join(",");
    }
    if (yearInfo) {
      params.text_filter = JSON.stringify({'yearR': [yearInfo]});
    }
    params.include_facets = "corpus_id,year";
    return this.get<any>('aggs', params).pipe(
      catchError(this.handleError)
    );
  }

  /* ------------------ Calls for searching in ONE document only ------------------ */
  public searchDocumentForAnnotation(corpusID: string, docID: string, searchQuery: SearchQuery): Observable<number[]> {
    let params = {
      text_query_field : searchQuery.annotationKey,
      text_query : searchQuery.annotationValue,
      size : '1',
      current_position : String(searchQuery.currentPosition),
      forward : `${searchQuery.forward}`,
    };
    return this.get<number[]>(`annotation_lookup/${corpusID}/${docID}`, params).pipe(
      catchError(this.handleError)
    );
  }

  public getDocument(documentID: string, corpusID: string) : Observable<StrixDocument> {
    return this.get(`document/${corpusID}/${documentID}`).pipe(
      map(this.extractDocumentData),
      catchError(this.handleError)
    );
  }
  public getDocumentBySentenceID(corpusID: string, sentenceID: string) : Observable<StrixDocument> {
    return this.get(`document/${corpusID}/sentence/${sentenceID}`).pipe(
      map(this.extractDocumentData),
      catchError(this.handleError)
    );
  }

  public getDocumentWithQuery(documentID: string, corpusID: string, query: string, inOrder: boolean = true): Observable<StrixDocument> {
    let params: any = {
      simple_highlight : 'false',
      token_lookup_from : "0",
      token_lookup_to : "1000",
      text_query : query
    };

    if (!inOrder) {
      params.in_order = "false";
    }
    return this.get<StrixDocument>(`search/${corpusID}/${documentID}`, params).pipe(
      map(this.extractDocumentData),
      catchError(this.handleError)
    );
  }

  public getTokenDataFromDocument(documentID: string, corpusID: string, start: number, end: number) {
    end++; // Because the API expects python style slicing indices
    let params = {
      include : "token_lookup",
      token_lookup_from : `${start}`,
      token_lookup_to : `${end}`,
    };
    return this.get(`document/${corpusID}/${documentID}`, params).pipe(
      map(this.extractTokenData),
      catchError(this.handleError)
    );
  }

  public getFullTokenDataFromDocument(documentID: string, corpusID: string, start: number, end:number, word_attr: string, attr_element: string) {
    let params = {
      include : "token_lookup",
      token_lookup_from : `${start}`,
      token_lookup_to : `${end}`,
      word_attr : `${word_attr}`,
      attr_element : `${attr_element}`,
    };
    return this.get(`document_full/${corpusID}/${documentID}`, params).pipe(
      catchError(this.handleError)
    );
  }

  private extractDocumentData(body: any): StrixDocument { // TODO: Update this
    // console.log('body', body);
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
    strixDocument.mostCommonWords = data.most_common_words;
    strixDocument.mostCommonNames = data.ner_tags;
    strixDocument.modeID = data.mode_id;
    return strixDocument;
  }

  private extractTokenData(body: any): any {
    // console.log('body', body);
    return body;
  }

  private handleError(error: HttpErrorResponse) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    return throwError(errMsg);
  }

  /* Related documents */
  public getRelatedDocuments(documentID: string, corpusID: string): Observable<StrixDocument> {
    let params = {
      exclude : 'token_lookup,dump,lines',
    };
    return this.get<StrixDocument>(`related/${corpusID}/${documentID}`, params).pipe(
      catchError(this.handleError)
    );
  }

  /* Related documents */
  public getSimilarDocuments(modeID: string, documentID: string, corpusID: string, corpora: string[], relDoc: string): Observable<StrixDocument> {
    let params: any = {
      exclude : 'token_lookup,dump,lines',
    };
    // params.related_doc_selection = relDoc;
    if (corpora) {
      params.corpora = corpora.join(",");
    }
    // params.text_filter = this.formatFilterObject([{field: "mode_id", value: modeID}]);
    return this.get<StrixDocument>(`similar/${corpusID}/${documentID}`, params).pipe(
      catchError(this.handleError)
    );
  }

  /* Related documents */
  public getVectorSearch(modeID: string, corpora: string[], query: string) {
    let params: any = {};
    params.query = query;
    if (corpora) {
      params.corpora = corpora.join(",");
    }
    // params.text_filter = this.formatFilterObject([{field: "mode_id", value: modeID}]);
    return this.get('search_vector', params).pipe(
      catchError(this.handleError)
    );
  }

  /* get data for Date Histogram */
  public getDateHistogramData(corpusID: string): Observable<StrixDocument> {
    let params = {date_field : "datefrom"};
    return this.get(`date_histogram/${corpusID}/year`, params).pipe(
      map(this.extractTokenData),
      catchError(this.handleError)
    );
  }

  /* Get annotations values */
  public getValuesForAnnotation(corpusID: string, documentID, annotationName: string) {
    return this.get(`aggs/${corpusID}/${documentID}/${annotationName}`).pipe(
      map(this.extractTokenData),
      catchError(this.handleError)
    );
  }

  //
  // public getTargetDocument(refID: string, documentID: string, corpora: string, modeID: string) {
  //   let params: any = {};

  //   if (corpora) {
  //     params.corpora = corpora;
  //   }
  //   if (modeID) {
  //     params.modes = modeID;
  //   }
  //   if (refID) {
  //     params.ref_id = refID;
  //   }
  //   if (documentID) {
  //     params.doc_id = documentID;
  //   }
    
  //   return this.get('documentTarget', params).pipe(
  //     catchError(this.handleError)
  //   );
  // }
  //

}
