import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Factura {
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
export class ExtractoDataService {
  private apiUrl = 'http://localhost:3000/api/datos/data_extracto';

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
    return this.http.get<any>(this.apiUrl, { params, headers });
  }

  editRecord(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  inactivateRecord(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/inactivate`, {});
  }
}
