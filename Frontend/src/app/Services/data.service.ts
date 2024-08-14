import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Factura {
  numero: string;
  nombre_socio: string;
  fecha_factura: string;
  fecha_vencimiento: string;
  actividades: string;
  importe_sin_impuestos: number;
  impuestos: number;
  total: number;
  total_en_divisa: number;
  importe_adeudado: number;
  estado_pago: string;
  estado: string;
  fecha_reprogramacion: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:3000/api/datos/datos';

  constructor(private http: HttpClient) { }

  getDatos(params: HttpParams): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  editRecord(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  inactivateRecord(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/inactivate`, {});
  }
}
