import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventInput } from '@fullcalendar/core';

// Define la interfaz para los datos de eventos del backend
export interface BackendEvent {
  id?: string;
  title: string;
  start: string | null;  // Las fechas están en formato ISO desde el backend
  end: string | null;
  description: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'http://localhost:3000/api/events';

  constructor(private http: HttpClient) {}

  getEvents(): Observable<EventInput[]> {
    return this.http.get<BackendEvent[]>(this.apiUrl).pipe(
      map(events =>
        events.map(event => ({
          id: event.id?.toString() || '',
          title: event.title,
          start: event.start ?? undefined,  // Asegúrate de que las fechas están en formato ISO
          end: event.end ?? undefined,
          backgroundColor: this.getBackgroundColorByStatus(event.status),
          borderColor: this.getBorderColorByStatus(event.status),
          textColor: this.getTextColorByStatus(event.status),
          extendedProps: {
            description: event.description || 'No description',
            status: event.status || 'No status',
          }
        }))
      )
    );
  }

  private getBackgroundColorByStatus(status: string): string {
    switch (status) {
      case 'consolidado':
        return '#d4edda'; // Light green
      case 'proyectado':
        return '#fff3cd'; // Light yellow
      default:
        return '#e2e3e5'; // Light gray for default
    }
  }

  private getBorderColorByStatus(status: string): string {
    switch (status) {
      case 'consolidado':
        return '#28a745'; // Green
      case 'proyectado':
        return '#ffc107'; // Yellow
      default:
        return '#6c757d'; // Gray for default
    }
  }

  private getTextColorByStatus(status: string): string {
    switch (status) {
      case 'consolidado':
      case 'proyectado':
        return '#000000'; // Black text for visibility on light backgrounds
      default:
        return '#343a40'; // Dark gray text for default
    }
  }
}
  