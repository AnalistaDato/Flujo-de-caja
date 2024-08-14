import { Component } from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { IconDirective } from '@coreui/icons-angular';
import { ContainerComponent, RowComponent, ColComponent, CardGroupComponent, TextColorDirective, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, FormControlDirective, ButtonDirective } from '@coreui/angular';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../app/Services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: true,
    imports: [ContainerComponent, RowComponent, ColComponent, CardGroupComponent, TextColorDirective, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, IconDirective, FormControlDirective, ButtonDirective, NgStyle,FormsModule, CommonModule]
})
export class LoginComponent {

  username: string = '';
  password: string = '';
  constructor(private authService: AuthService, private Router: Router) {}

  login(): void {
    this.authService.login(this.username, this.password).subscribe({
      next: () => this.Router.navigate(['/calendario']),
      error: (err) => console.error('Acceso restringido', err)
    })
  }
 
}