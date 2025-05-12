import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private RegsiterUrl = `${environment.apiBaseUrl}/register`;  // Aquí ya tienes '/register', no es necesario añadirlo de nuevo.

  constructor(private http: HttpClient) { }

  // 📌 Registrar usuario
  register(userData: any): Observable<any> {
    return this.http.post(this.RegsiterUrl, userData).pipe(
      catchError(this.handlerError)
    );
  }

  private handlerError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error inesperado';
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    }
    return throwError(() => new Error(errorMessage));
  }
}
