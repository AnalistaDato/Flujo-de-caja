import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


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

  private apiUrl = 'http://localhost:3000/api/consolidado';

  constructor(private http: HttpClient) { }

  getDatos(params: HttpParams): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  updateStatus(ids: number[]): Observable<any> {
    const body = { ids }; // Body with array of IDs
    return this.http.put<any>(this.apiUrl, body); // PUT request to update status
  }
}
 
