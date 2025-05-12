import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import jwt_decode from 'jwt-decode';
import { environment } from '../../environments/environment';


@Injectable({ 
  providedIn: 'root'
})
export class AuthService {

  private LOGIN_URL = `${environment.apiBaseUrl}/auth/login`;
  private tokenKey = 'authToken';

  constructor(private httpClient: HttpClient, private router: Router) { }

  login(username: string, password: string): Observable<any> {
    return this.httpClient.post<any>(this.LOGIN_URL, { username, password }).pipe(
      tap(response => {
        if (response.token) {
          console.log('Token saved:', response.token);
          this.setToken(response.token);
        }
      })
    );
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const decoded: any = jwt_decode(token);
      const exp = decoded?.exp ? decoded.exp * 1000 : 0;
      const isValid = Date.now() < exp;

      if (!isValid) {
        this.logout();
      }

      return isValid;
    } catch (error) {
      console.error('Error decoding token:', error);
      this.logout();
      return false;
    }
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const decoded: any = jwt_decode(token);
      return decoded?.role || null; // Asegurarse de que el rol está en el token
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';

    if (error.error?.message) {
      errorMessage = error.error.message; // Captura el mensaje enviado por el backend
    } else if (error.status === 0) {
      errorMessage = 'No hay conexión con el servidor';
    } else if (error.status === 401) {
      errorMessage = 'Credenciales incorrectas';
    } else if (error.status === 403) {
      errorMessage = error.error.message || 'Acceso denegado';
    }

    return throwError(() => new Error(errorMessage));
  }
}
