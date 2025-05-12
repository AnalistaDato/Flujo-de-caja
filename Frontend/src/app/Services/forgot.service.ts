import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ForgotService {

  private apiUrl = `${environment.apiBaseUrl}/forgot-password`;

  constructor(private http: HttpClient) { }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(this.apiUrl, { email });
  }
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/reset-password/${token}`, { newPassword });
  }
  
}
