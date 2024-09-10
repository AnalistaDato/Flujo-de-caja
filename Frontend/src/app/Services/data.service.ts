import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

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
  importe_adeudado: number;
  estado_pago: string;
  estado: string;
  fecha_reprogramacion: string;
  created_at: string;
  conf_banco: string;
  nuevo_pago: number;
  empresa: string;
  cuenta_bancaria_numero: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = 'http://localhost:3000/api/datos/datos';

  // BehaviorSubject to store the selected factura
  private selectedFacturaSubject = new BehaviorSubject<Factura | null>(null);
  selectedFactura$ = this.selectedFacturaSubject.asObservable();

  constructor(private http: HttpClient) { }

  getDatos(params: HttpParams): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params });
  }

  getFacturaById(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.apiUrl}/${id}`);
  }

  editRecord(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  inactivateRecord(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/inactivate`, {});
  }

  // Method to set the selected factura
  setSelectedFactura(factura: Factura): void {
    this.selectedFacturaSubject.next(factura);
  }

  // Optional: Method to clear the selected factura
  clearSelectedFactura(): void {
    this.selectedFacturaSubject.next(null);
  }
}
