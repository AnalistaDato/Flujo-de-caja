import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


export interface BackendEvent {
  id?: string;
  title: string;
  start: string | null;  // Las fechas están en formato ISO desde el backend
  end: string | null;
  description: string;
  status: string;
  amount: number; // Asumiendo que el evento tiene un importe asociado
}

export interface DaySummary {
  date: string;
  saldoInicial: number;
  ingresos: number;
  gastos: number;
  saldoFinal: number;
}


@Injectable({
  providedIn: 'root'
})



export class FlujoService {

  private apiUrl = 'http://localhost:3000/api/events';

  constructor(private http: HttpClient) {}

  getDaySummaries(month: number, year: number): Observable<DaySummary[]> {
    return this.http.get<BackendEvent[]>(this.apiUrl).pipe(
      map(events => this.organizarPorDia(events, month, year))
    );
  }
  private organizarPorDia(events: BackendEvent[], month: number, year: number): DaySummary[] {
    const daysInMonth = new Date(year, month, 0).getDate();
    let saldoAnterior = 0;
    const summaries: DaySummary[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day).toISOString().split('T')[0];
      const eventsForDay = events.filter(event => event.start?.startsWith(date));

      const ingresos = eventsForDay
        .filter(event => event.status === 'Pagado' || event.status === 'Pagado Parcialmente')
        .reduce((sum, event) => sum + event.amount, 0);

      const gastos = eventsForDay
        .filter(event => event.status === 'No pagadas' || event.status === 'Revertido')
        .reduce((sum, event) => sum + event.amount, 0);

      const saldoFinal = saldoAnterior + ingresos - gastos;

      summaries.push({
        date,
        saldoInicial: saldoAnterior,
        ingresos,
        gastos,
        saldoFinal
      });

      saldoAnterior = saldoFinal;
    }

    return summaries;
  }
}

