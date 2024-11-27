import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '@environments/environment';

export interface cuentasContables {
  id: number;
  cuenta_contable: string;
  fecha: string;
}

@Injectable({
  providedIn: 'root',
})
export class CuentasContablesService {

  private readonly UPLOAD_URL = `${environment.apiBaseUrl}/cuentas_contables`;

  constructor(private http: HttpClient) {}

  // Generar encabezados con token de autorización
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    console.log('Encabezados generados:', headers);
    return headers;
  }
  

  // Subir archivo al servidor
  uploadFile(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
  
    const headers = this.getAuthHeaders(); // Asegúrate de obtener los encabezados
  
    // Usa HttpClient.post para simplificar
    return this.http.post(this.UPLOAD_URL, formData, {
      headers: headers,
      reportProgress: true,
      observe: 'events', // Necesario para obtener los eventos como HttpEvent
    }).pipe(
      map(event => this.getEventMessage(event, file)),
      catchError(error => this.handleError(error, file))
    );
  }

  // Obtener cuentas contables
  getCuentasContables(): Observable<cuentasContables[]> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  
    return this.http.get<cuentasContables[]>(this.UPLOAD_URL, { headers }).pipe(
      catchError(this.handleGetError)
    );
  }

  // Manejo de errores para obtener datos
  private handleGetError(error: HttpErrorResponse): Observable<any> {
    console.error('Error al obtener los datos:', error);
    return of({ status: 'error', message: 'Error al obtener las cuentas contables' });
  }

  // Generar mensajes para eventos de carga de archivos
  private getEventMessage(event: HttpEvent<any>, file: File): any {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        if (event.total) {
          const percentDone = Math.round(100 * event.loaded / event.total);
          return { status: 'progress', message: `${percentDone}% Subido` };
        }
        return { status: 'progress', message: 'La carga está en proceso' };
      case HttpEventType.Response:
        return { status: 'success', message: 'Archivo subido correctamente', body: event.body };
      default:
        return { status: 'unknown', message: `Evento desconocido: ${event.type}` };
    }
  }

  // Manejo de errores para la carga de archivos
  private handleError(error: any, file: File): Observable<any> {
    console.error('Error durante la carga:', error);
    return of({
      status: 'error',
      message: `Error al cargar el archivo: ${file.name}`,
      errorDetails: error.message,
    });
  }
}
