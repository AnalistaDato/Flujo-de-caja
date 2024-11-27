import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '@environments/environment';

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

  private PROVEDORES_URL = `${environment.apiBaseUrl}/provedores`

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getPriovedores(empresa?: string): Observable<provedores[]> {
    const headers = this.getAuthHeaders(); // Obtén las cabeceras con el token
    let params = new HttpParams();
    if(empresa) {
      params = params.set('empresa', empresa);
  }
    return this.http.get<provedores[]>(this.PROVEDORES_URL, {params, headers}).pipe(
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
