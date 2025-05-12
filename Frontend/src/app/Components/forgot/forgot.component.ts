import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective, CardBodyComponent, CardComponent, CardGroupComponent, ColComponent, ContainerComponent, FormControlDirective, InputGroupComponent, InputGroupTextDirective, RowComponent, TextColorDirective } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ForgotService } from 'app/Services/forgot.service';

@Component({
  selector: 'app-forgot',
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
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.css']
})
export class ForgotComponent {
  forgotForm: FormGroup;
  message: string = '';

  constructor(private fb: FormBuilder, private forgotService: ForgotService) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]  
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;

    const email = this.forgotForm.get('email')?.value;  

    this.forgotService.forgotPassword(email).subscribe({
      next: (response) => {
        this.message = response.message;
      },
      error: (error) => {
        this.message = error.error?.message || 'Error en la solicitud';
      }
    });
  }
}
