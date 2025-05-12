import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '@environments/environment';

export interface FacturaConsolidada {
  id: number;
  numero: string;
  nombre_socio: string;
  fecha_factura: Date | null; // Cambiado de string a Date | null
  fecha_vencimiento: Date | null; // Cambiado de string a Date | null
  fecha_reprogramacion: Date | null; // Cambiado de string a Date | null
  total_en_divisa: number;
  importe_adeudado_sin_signo: number;
  estado_pago:string;
  estado_g:string;  
  estado:string;
  empresa:string
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

   private apiUrl = `${environment.apiBaseUrl}/all`;

  private notificacionesSubject = new BehaviorSubject<FacturaConsolidada[]>([]);
  notificaciones$ = this.notificacionesSubject.asObservable();
  

  constructor(private http: HttpClient) {
    this.actualizarNotificaciones();
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

    getDatos(params: HttpParams): Observable<any> {
      const headers = this.getAuthHeaders();
      return this.http.get<any>(this.apiUrl, { params, headers })
        .pipe(
          map(response => {
            // Si la API devuelve un array directamente, asignarlo a 'data'
            const data = Array.isArray(response) ? response : response.data;
    
            if (!data) {
              throw new Error("No se recibieron datos de la API");
            }
    
            return data.map((factura: FacturaConsolidada) => ({
              ...factura,
              fecha: factura.fecha_vencimiento ? new Date(factura.fecha_vencimiento) : null,
              fecha_reprogramacion: factura.fecha_reprogramacion ? new Date(factura.fecha_reprogramacion) : null
            }));
          }),
          catchError(error => {
            console.error('Error al obtener los datos:', error);
            return throwError(error);
          })
        );
    }

    actualizarNotificaciones(): void {
      this.getDatos(new HttpParams())
        .subscribe(response => {
          const facturas = response as FacturaConsolidada[];
    
    
          const hoy = new Date();
          const sieteDiasAntes = new Date(hoy);
          sieteDiasAntes.setDate(hoy.getDate() - 7); // Rango de 7 días antes
    
          const sieteDiasDespues = new Date(hoy);
          sieteDiasDespues.setDate(hoy.getDate() + 7); // Rango de 7 días después
    
       
          // Verifica si facturas no está vacío
          if (!facturas || facturas.length === 0) {
            this.notificacionesSubject.next([]);  // Si no hay facturas, pasa un array vacío
            return;
          }
    
          // Filtra las facturas
          const facturasFiltradas = facturas.filter(factura => {
            const fechaReprogramacion = factura.fecha_reprogramacion ? new Date(factura.fecha_reprogramacion) : undefined;
            const fechaFactura = factura.fecha_vencimiento ? new Date(factura.fecha_vencimiento) : undefined;
    
            
            const esFechaValida = this.estaDentroDelRango(fechaReprogramacion, fechaFactura);
           
            return esFechaValida;
          });
    
    
    
          this.notificacionesSubject.next(facturasFiltradas);
        });
    }
  }    
