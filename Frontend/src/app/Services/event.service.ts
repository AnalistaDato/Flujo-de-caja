import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventInput } from '@fullcalendar/core';

// Define the interface for the backend event data
interface BackendEvent {
  id?: string;
  title: string;
  description: string;
  start: string | null;
  end: string | null;
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
          start: event.start ?? undefined,
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
      case 'Pagado':
        return '#d4edda'; // Light green
      case 'Pagado Parcialmente':
        return '#fff3cd'; // Light yellow
      case 'No pagadas':
        return '#f8d7da'; // Light red
      case 'Revertido':
        return '#ffe5b4'; // Light orange
      default:
        return '#e2e3e5'; // Light gray for default
    }
  }

  private getBorderColorByStatus(status: string): string {
    switch (status) {
      case 'Pagado':
        return '#28a745'; // Green
      case 'Pagado Parcialmente':
        return '#ffc107'; // Yellow
      case 'No pagadas':
        return '#dc3545'; // Red
      case 'Revertido':
        return '#fd7e14'; // Orange
      default:
        return '#6c757d'; // Gray for default
    }
  }

  private getTextColorByStatus(status: string): string {
    switch (status) {
      case 'Pagado':
      case 'Pagado Parcialmente':
      case 'No pagadas':
      case 'Revertido':
        return '#000000'; // Black text for visibility on light backgrounds
      default:
        return '#343a40'; // Dark gray text for default
    }
  }
}
