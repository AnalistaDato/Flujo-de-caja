import { HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
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
    const token = localStorage.getItem('authToken');
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    // Obtener el token del localStorage
    if (!token) {
      console.error('🚨 No se encontró el token');
      return of({ status: 'error', message: 'Token no encontrado' });
    }

    // Crear los headers con el token
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Crear la solicitud con los headers
    const req = new HttpRequest('POST', this.UPLOAD_URL, formData, {
      headers: headers,  // Agregar los headers
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
        return { status: 'progress', message: 'La carga está en proceso' };
      case HttpEventType.Response:
        return { status: 'success', message: 'Archivo subido correctamente', body: event.body };
      default:
        return { status: 'unknown', message: `Evento desconocido: ${event.type}` };
    }
  }

  private handleError(file: File) {
    return (error: any): Observable<any> => {
      console.error('Error registrado:', error);
      return of({ status: 'error', message: `Error al cargar:  ${file.name}` });
    };
  }
}
