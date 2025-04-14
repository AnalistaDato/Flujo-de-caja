import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FactrurasService {
  private UPLOAD_URL = `${environment.apiBaseUrl}/consolidacion`;

  constructor(private http: HttpClient) { }

  uploadFile(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    const req = new HttpRequest('POST', this.UPLOAD_URL, formData, {
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
