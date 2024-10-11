import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

export interface provedores {
  id: string;
  nombre_provedor: string;
  NIT: string;
  empresa: string;
  digito: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProvedoresService {

  private PROVEDORES_URL = 'http://localhost:3000/api/provedores'

  constructor(private http: HttpClient) { }

  getPriovedores(empresa?: string): Observable<provedores[]> {
    let params = new HttpParams();
    if(empresa) {
      params = params.set('empresa', empresa);
  }
    return this.http.get<provedores[]>(this.PROVEDORES_URL, {params}).pipe(
      catchError(this.handleGetError())
    )
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
}
