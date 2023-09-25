import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class KarpService {

  private readonly KARPBACKEND_URL = "https://ws.spraakbanken.gu.se/ws/karp/v4";

  // https://ws.spraakbanken.gu.se/ws/karp/v4/autocomplete?mode=external&multi=" + ",".join(terms) + "&resource=saldom

  constructor(private http: HttpClient) { }

  public lemgramsFromWordform(wordform: string) : Observable<string[]> {
    if (wordform === "") return from([]);
    // console.log("Getting Karp lemgrams from the wordform", wordform);
    let url = `${this.KARPBACKEND_URL}/autocomplete?q=${wordform}&resource=saldom`;
    // console.log('url', url);
    return this.http.get(url).pipe(
      map(this.extractDocumentData),
      catchError(this.handleError)
    );
  }

  private extractDocumentData(result: any): string[] {
    let lemgrams: string[] = [];

    if (result.hits !== 0) {
      for (let hit of result.hits.hits) {
        let lemgram : string = hit._source.FormRepresentations[0].lemgram;
        lemgrams.push(lemgram);
      }
    }

    // console.log("found lemgrams", lemgrams);
    return lemgrams;
  }

  private handleError(error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    return throwError(errMsg);
  }

}
