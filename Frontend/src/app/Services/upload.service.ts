import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private UPLOAD_URL = `${environment.apiBaseUrl}/upload`;

  constructor(private http: HttpClient) { }


  private getAuthHeaders(isMultipart = false): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('⚠️ No se encontró el token en localStorage.');
    }

    if (!isMultipart) {
      headers = headers.set('Content-Type', 'application/json');
    }

    return headers;
  }


  uploadFile(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    const headers = this.getAuthHeaders(true);
 
    const req = new HttpRequest('POST', this.UPLOAD_URL, formData, {
      headers: headers,
      reportProgress: true,
      responseType: 'json'
    });

    return this.http.request(req).pipe(
      map(event => this.getEventMessage(event, file)),
      catchError(this.handleError(file))
    );
  }

  private getEventMessage(event: HttpEvent<any>, file: File): any {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        if (event.total) {
          const percentDone = Math.round(100 * event.loaded / event.total);
          return { status: 'progress', message: `${percentDone}% Subido` };
        }
        return { status: 'progress', message: 'La carga esta en proceso' };
      case HttpEventType.Response:
        return { status: 'success', message: 'Archivo subido correctamente', body: event.body };
      default:
        return { status: 'unknown', message: `Evento deconocido: ${event.type}` };
    }
  }

  private handleError(file: File) {
    return (error: any): Observable<any> => {
      console.error('Error registrado:', error);
      return of({ status: 'error', message: `Carga de:  ${file.name}` });
    };
  }
}