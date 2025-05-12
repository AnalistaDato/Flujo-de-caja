import { Component } from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { IconDirective } from '@coreui/icons-angular';
import { ContainerComponent, RowComponent, ColComponent, CardGroupComponent, TextColorDirective, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, FormControlDirective, ButtonDirective } from '@coreui/angular';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../app/Services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [RouterLink, ButtonDirective, ContainerComponent, RowComponent, ColComponent, CardGroupComponent, TextColorDirective, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, IconDirective, FormControlDirective, ButtonDirective, FormsModule, CommonModule]
})
export class LoginComponent {

  username: string = '';
  password: string = '';
  errorMessage: string = ''; // Variable para mostrar mensajes de error
  showError: boolean = false; // Controla si se muestra el error o no


  constructor(private authService: AuthService, private Router: Router) { }

  login(): void {
    this.errorMessage = ''; // Limpiar el mensaje de error antes de cada intento
    this.showError = false;
  
    if (!this.username || !this.password) {
      this.errorMessage = 'Usuario y contraseña son obligatorios.';
      this.showError = true;
      return;
    }
  
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        console.log('Redirigiendo a calendario...');
        this.Router.navigate(['/calendario']);
      },
      error: (err) => {
        console.error('Error de autenticación:', err);
  
        // Usar el mensaje que envía el backend
        if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Error desconocido. Intente de nuevo.';
        }
  
        this.showError = true;
      }
    });
  }
}

