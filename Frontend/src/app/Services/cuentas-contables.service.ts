import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';



export interface cuentasContables {
  id: number;
  cuenta_contable: string;
  fecha: string;
}

@Injectable({
  providedIn: 'root'
})
export class CuentasContablesService {

  private UPLOAD_URL = 'http://localhost:3000/api/cuentas_contables';
  ge: any;

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

  // Método para obtener los datos de cuentas_contables
  getCuentasContables(): Observable<any> {
    return this.http.get<any>(this.UPLOAD_URL).pipe(
      catchError(this.handleGetError())
    );
  }

  private handleGetError() {
    return (error: HttpErrorResponse): Observable<any> => {
      console.error('Error al obtener los datos:', error);
      return of({ status: 'error', message: 'Error al obtener las cuentas contables' });
    };
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
function of(arg0: { status: string; message: string; }): Observable<any> {
  throw new Error('Function not implemented.');
}

