import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { FacturaConsolidada } from './notificacion.service';


export interface FacturaProyectada {
  id: number;
  factura: string;
  fecha: Date | null; // Cambiado de string a Date | null
  fecha_reprogramacion: Date | null; // Cambiado de string a Date | null
  cuenta: string;
  detalle: string;
  comunicacion: string;
  debito: number;
  credito: number;
  socio: string;
  banco: string;
  estado:string;
  empresa:string
}


@Injectable({
  providedIn: 'root'
})
export class ProyectadosService {

  private apiUrl = `${environment.apiBaseUrl}/proyecciones`;


  private proyeccionesSubject = new BehaviorSubject<FacturaProyectada[]>([]);
  proyecciones$ = this.proyeccionesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.actualizarProyecciones();

  }
  
  private estaDentroDelRango(fechaReprogramacion: Date | undefined, fechaFactura: Date | undefined): boolean {
    // Usar la fecha de reprogramación si no es undefined, o la fecha de factura si la de reprogramación es undefined
    const fechaAUsar = fechaReprogramacion ? new Date(fechaReprogramacion) : (fechaFactura ? new Date(fechaFactura) : undefined);

    if (!fechaAUsar) return false; // Si ambas son undefined, retornamos false

    const hoy = new Date();
    const sieteDiasAntes = new Date(hoy);
    sieteDiasAntes.setDate(hoy.getDate() - 7); // Establece el rango de 7 días antes

    const sieteDiasDespues = new Date(hoy);
    sieteDiasDespues.setDate(hoy.getDate() + 7); // Establece el rango de 7 días después

    // Normalizar la fecha de comparación (eliminamos la hora)
    const fechaComparacion = new Date(fechaAUsar);
    fechaComparacion.setHours(0, 0, 0, 0); // Aseguramos que la hora esté a 00:00:00

    // Compara la fecha seleccionada (reprogramación o factura) con el rango de ±7 días
    return fechaComparacion >= sieteDiasAntes && fechaComparacion <= sieteDiasDespues;
  }

  // Helper function to get headers with Authorization authToken
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
  getDatosall(params: HttpParams): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/all`, { params, headers })
      .pipe(
        map(response => {
          console.log('Datos recibidos de la API:', response); // Log para ver toda la respuesta
  
          // Asegúrate de que la respuesta sea un array
          if (!Array.isArray(response)) {
            console.error('La respuesta no es un array');
            throw new Error("La respuesta no es un array");
          }
  
          // Revisa el primer objeto de la respuesta para verificar que tiene las propiedades correctas
          console.log('Primer objeto de los datos:', response[0]);
  
          return response.map((factura: FacturaProyectada) => ({
            ...factura,
            fecha: factura.fecha ? new Date(factura.fecha) : null,
            fecha_reprogramacion: factura.fecha_reprogramacion ? new Date(factura.fecha_reprogramacion) : null
          }));
        }),
        catchError(error => {
          console.error('Error al obtener los datos:', error);
          return throwError(error);
        })
      );
  }
  
  getDatos(params: HttpParams): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}`, { params, headers })
      .pipe(
        map(response => {
          console.log('Datos recibidos de la API:', response); // Log para ver los datos recibidos
  
          // Aquí no hacemos nada con los datos, solo los retornamos tal cual
          return response;
        }),
        catchError(error => {
          console.error('Error al obtener los datos:', error);
          return throwError(error);
        })
      );
  }

actualizarProyecciones(): void {
  this.getDatosall(new HttpParams())
    .subscribe(response => {
      const facturas = response as FacturaProyectada[];

      console.log('Facturas antes de filtrar:', facturas); // Log para ver las facturas antes del filtrado

      // Filtra las facturas dentro del rango de ±7 días
      const facturasFiltradas = facturas.filter(factura => {
        const fechaReprogramacion = factura.fecha_reprogramacion ? new Date(factura.fecha_reprogramacion) : undefined;
        const fechaFactura = factura.fecha ? new Date(factura.fecha) : undefined;

        // Verifica si la fecha de factura o la de reprogramación está dentro del rango
        return this.estaDentroDelRango(fechaReprogramacion, fechaFactura);
      });

      console.log('Facturas filtradas:', facturasFiltradas); // Log para ver las facturas después del filtrado

      this.proyeccionesSubject.next(facturasFiltradas);
    });
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
  
}
