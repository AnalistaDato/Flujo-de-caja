import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonDirective, ContainerComponent, RowComponent, ColComponent, CardGroupComponent, TextColorDirective, CardComponent, CardBodyComponent, InputGroupComponent, InputGroupTextDirective, FormControlDirective } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ForgotService } from 'app/Services/forgot.service';


@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    ButtonDirective,
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardGroupComponent,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    InputGroupComponent,
    InputGroupTextDirective,
    IconDirective,
    FormControlDirective,
    CommonModule
  ],
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.css']
})
export class ResetComponent {

  resetForm: FormGroup;
  message: string = '';
  token: string | null = '';
  passwordVisible: boolean = true;

  constructor(
    private fb: FormBuilder,
    private forgotService: ForgotService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    // Initialize the form
    const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6), Validators.pattern(strongPasswordPattern)]],  
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordsMatch });

    // Get the token directly from the route parameters
    this.token = this.route.snapshot.paramMap.get('token');
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  passwordsMatch(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordsMismatch: true };
  }

  onSubmit() {
    if (this.resetForm.invalid) return;

    const { newPassword, confirmPassword } = this.resetForm.value;

    if (newPassword !== confirmPassword) {
      this.message = 'Las contraseñas no coinciden.';
      return;
    }

    // Send the request to the backend
    this.http.post(`http://localhost:3000/api/reset-password/${this.token}`, { newPassword })
      .subscribe({
        next: (res: any) => {
          this.message = res.message;
          setTimeout(() => this.router.navigate(['/login']), 3000); // Redirect after 3 seconds
        },
        error: (err) => {
          console.error(err);
          this.message = 'Error al restablecer la contraseña.';
        }
      });
  }
}