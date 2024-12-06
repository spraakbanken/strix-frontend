import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class KarpService {

  // private readonly KARPBACKEND_URL = "https://ws.spraakbanken.gu.se/ws/karp/v4";
  private readonly KARPBACKEND_URL = "https://spraakbanken4.it.gu.se/karp/v7";

  // https://ws.spraakbanken.gu.se/ws/karp/v4/autocomplete?mode=external&multi=" + ",".join(terms) + "&resource=saldom

  constructor(private http: HttpClient) { }

  public getLemgramFromWordForm(wordform: string) : Observable<string[]> {
    let url = `${this.KARPBACKEND_URL}/query/saldom?q=equals%7CinflectionTable.writtenForm%7C${wordform}&path=entry.lemgram`;
    let result = this.http.get(url).pipe(
      map(this.extractDocumentData),catchError(this.handleError));
    return result;
  }
  public lemgramsFromWordform(wordform: string) : Observable<string[]> {
    if (wordform === "") return from([]);
    // console.log("Getting Karp lemgrams from the wordform", wordform);
    let url = `${this.KARPBACKEND_URL}/query/saldom?q=equals%7CinflectionTable.writtenForm%7C${wordform}&path=entry.lemgram`;
    // console.log('url', url);
    return this.http.get(url).pipe(
      map(this.extractDocumentData),
      catchError(this.handleError)
    );
  }

  private extractDocumentData(result: any): string[] {
    let lemgrams: string[] = [];

    if (result.hits !== 0) {
      lemgrams = result.hits;
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
