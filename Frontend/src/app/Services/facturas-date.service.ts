import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, throwError } from 'rxjs';
import { Factura } from './data.service';
import { map } from 'rxjs/operators';

export interface FacturaConsolidada {
  id: number;
  factura: string;
  fecha: Date | null; // Cambiado de string a Date | null
  fecha_reprogramacion: Date | null; // Cambiado de string a Date | null
  cuenta: string;
  detalle: string;
  debito: number;
  credito: number;
  socio: string;
  banco: string;
  empresa:string
}

@Injectable({
  providedIn: 'root'
})
export class FacturasDateService {
  private apiUrl = 'http://localhost:3000/api/facturas';

  // BehaviorSubject to store the selected factura
  private selectedFacturaSubject = new BehaviorSubject<FacturaConsolidada | null>(null);
  selectedFactura$ = this.selectedFacturaSubject.asObservable();

  constructor(private http: HttpClient) { }

   // Helper function to get headers with Authorization authToken
   private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    console.log("Token:", token); // Verifica que el token exista
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getDatos(params: HttpParams): Observable<any> {
    const headers = this.getAuthHeaders(); // Obtén las cabeceras con el token
    return this.http.get<any>(this.apiUrl, { params, headers  })
      .pipe(
        map(response => ({
          ...response,
          data: response.data.map((factura: FacturaConsolidada) => ({
            ...factura,
            fecha: factura.fecha ? new Date(factura.fecha) : null,
            fecha_reprogramacion: factura.fecha_reprogramacion ? new Date(factura.fecha_reprogramacion) : null
          }))
        })),
        catchError(error => {
          console.error('Error al obtener los datos:', error);
          return throwError(error);
        })
      );
  }
  
  getFacturaById(id: number): Observable<FacturaConsolidada> {
    const headers = this.getAuthHeaders(); // Obtén las cabeceras con el token
    return this.http.get<FacturaConsolidada>(`${this.apiUrl}/${id}`, { headers })
      .pipe(
        map(factura => ({
          ...factura,
          fecha: factura.fecha ? new Date(factura.fecha) : null,
          fecha_reprogramacion: factura.fecha_reprogramacion ? new Date(factura.fecha_reprogramacion) : null
        })),
        catchError(error => {
          console.error(`Error al obtener la factura con ID ${id}:`, error);
          return throwError(error);
        })
      );
  }
  editRecord(id: number, data: any): Observable<any> {
    const headers = this.getAuthHeaders(); // Obtén las cabeceras con el token
    return this.http.put<any>(`${this.apiUrl}/${id}`, data, { headers })
      .pipe(
        catchError(error => {
          console.error(`Error al editar la factura con ID ${id}:`, error);
          return throwError(error);
        })
      );
  }
  
  inactivateRecord(id: number): Observable<any> {
    const headers = this.getAuthHeaders(); // Obtén las cabeceras con el token
    return this.http.put<any>(`${this.apiUrl}/${id}/inactivate`, {}, { headers })
      .pipe(
        catchError(error => {
          console.error(`Error al inactivar la factura con ID ${id}:`, error);
          return throwError(error);
        })
      );
  }

  // Method to set the selected factura
  setSelectedFactura(factura: FacturaConsolidada): void {
    this.selectedFacturaSubject.next(factura);
  }

  // Optional: Method to clear the selected factura
  clearSelectedFactura(): void {
    this.selectedFacturaSubject.next(null);
  }

}
