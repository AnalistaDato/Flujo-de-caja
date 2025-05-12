import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { BehaviorSubject, Observable, catchError, throwError } from 'rxjs';


export interface User {
  Id: number;
  Username: string;
  Email: string;
  Rol: string;
  Estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private apiUrl = `${environment.apiBaseUrl}/users`;

  private selectedUser = new BehaviorSubject<User | null>(null);
  selectedUser$ = this.selectedUser.asObservable();

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }


  getDatos(params: HttpParams): Observable<any> {
    const headers = this.getAuthHeaders(); // Obtén las cabeceras con el token
    return this.http.get<any>(this.apiUrl, { params, headers }) // Asegúrate de pasar las cabeceras
      .pipe(
        catchError(error => {
          console.error('Error al obtener los datos:', error);
          return throwError(error);
        })
      );
  }
  getUserById(id: number): Observable<User> {
    const headers = this.getAuthHeaders(); // Obtén las cabeceras con el token
    return this.http.get<User>(`${this.apiUrl}/${id}`, { headers })
      .pipe(
        catchError(error => {
          console.error(`Error al obtener el usuario con ID ${id}:`, error);
          return throwError(error);
        })
      );
  }
  editUser(id: number, data: any): Observable<any> {
    const headers = this.getAuthHeaders(); // Obtén las cabeceras con el token
    return this.http.put<any>(`${this.apiUrl}/${id}`, data, { headers })
      .pipe(
        catchError(error => {
          console.error(`Error al editar el usuario con ID ${id}:`, error);
          return throwError(error);
        })
      );
  }
  setSelectedUser(users: User): void {
    this.selectedUser.next(users);
  }

  updateUserStatus(id: number, status: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${id}/status`, { status },{headers})
      .pipe(
        catchError(error => {
          console.error(`Error al actualizar el estado del usuario con Id ${id}:`, error);
          return throwError(error);
        })
      );
  }

}
