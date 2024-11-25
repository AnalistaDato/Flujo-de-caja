import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Cuenta {
  id: string;
  empresa: string;
  cuenta: string;
  banco: string;
  cta_corriente: string;
}

@Injectable({
  providedIn: 'root'
})
export class CuentasService {

  private apiUrl = 'http://localhost:3000/api/cuentas';

  constructor(private http: HttpClient) { }

  // Función para obtener los headers con el token de autorización
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Función para obtener datos con un filtro opcional de empresa
  getDatos(empresa?: string): Observable<Cuenta[]> {
    const headers = this.getAuthHeaders(); // Obtén las cabeceras con el token
    let params = new HttpParams();

    // Agregar parámetro opcional si se proporciona
    if (empresa) {
      params = params.set('empresa', empresa);
    }

    // Realizar la solicitud GET
    return this.http.get<Cuenta[]>(this.apiUrl, { params, headers });
  }
}
