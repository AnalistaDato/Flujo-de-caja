import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';


export interface Extracto {
  fecha: string;
  descripcion: string;
  valor: number;
  saldo: number;
  estado: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConsolidadoService {

  private apiUrl = `${environment.apiBaseUrl}/consolidado`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getDatos(params: HttpParams): Observable<any> {
    const headers = this.getAuthHeaders(); // Obtén las cabeceras con el token
    return this.http.get<any>(this.apiUrl, { params, headers});
  }

  updateStatus(ids: number[]): Observable<any> {
    const body = { ids }; // Body with array of IDs
    return this.http.put<any>(this.apiUrl, body); // PUT request to update status
  }
}
 
