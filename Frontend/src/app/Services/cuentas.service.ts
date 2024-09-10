import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Cuenta {
  id: string;
  empresa: string;
  cuenta: string;
  banco: string;
  cta_corriente: string;
}

@Injectable({
  providedIn: 'root'
})
export class CuentasService {

  private apiUrl = 'http://localhost:3000/api/cuentas';

  constructor(private http: HttpClient) { }

  getDatos(empresa?: string): Observable<Cuenta[]> {
    let params = new HttpParams();
    if (empresa) {
      params = params.set('empresa', empresa);
    }
    return this.http.get<Cuenta[]>(this.apiUrl, { params });
  }
}
