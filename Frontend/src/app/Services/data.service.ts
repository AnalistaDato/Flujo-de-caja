import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Factura {
  id: number;
  numero: string;
  nombre_socio: string;
  fecha_factura: string;
  fecha_vencimiento: string;
  actividades: string;
  importe_sin_impuestos: number;
  impuestos: number;
  total: number;
  total_en_divisa: number;
  importe_adeudado_sin_signo: number;
  estado_pago: string;
  estado_g: string;
  estado: string;
  fecha_reprogramacion: string;
  created_at: string;
  conf_banco: string;
  nuevo_pago: number;
  empresa: string;
  cuenta_bancaria_numero: string;
  cuenta_contable: string;
  diferencia: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = `${environment.apiBaseUrl}/datos/datos`;

  private selectedFacturaSubject = new BehaviorSubject<Factura | null>(null);
  selectedFactura$ = this.selectedFacturaSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getDatos(params: HttpParams): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(this.apiUrl, { params, headers }).pipe(
      catchError(error => {
        console.error('Error al obtener los datos:', error);
        return throwError(error);
      })
    );
  }

  getFacturaById(id: number): Observable<Factura> {
    const headers = this.getAuthHeaders();
    return this.http.get<Factura>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(error => {
        console.error(`Error al obtener la factura con ID ${id}:`, error);
        return throwError(error);
      })
    );
  }

  createRecord(data: Factura): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl, data, { headers }).pipe(
      catchError(error => {
        console.error('Error al crear la factura:', error);
        return throwError(error);
      })
    );
  }

  editRecord(id: number, data: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${id}`, data, { headers }).pipe(
      catchError(error => {
        console.error(`Error al editar la factura con ID ${id}:`, error);
        return throwError(error);
      })
    );
  }

  inactivateRecord(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${id}/inactivate`, {}, { headers }).pipe(
      catchError(error => {
        console.error(`Error al inactivar la factura con ID ${id}:`, error);
        return throwError(error);
      })
    );
  }

  setSelectedFactura(factura: Factura): void {
    this.selectedFacturaSubject.next(factura);
  }

  clearSelectedFactura(): void {
    this.selectedFacturaSubject.next(null);
  }

  updateToConsolidado(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${id}/consolidado`, {}, { headers }).pipe(
      catchError(error => {
        console.error(`Error al actualizar el estado a "consolidado" para la factura con ID ${id}:`, error);
        return throwError(error);
      })
    );
  }
}
