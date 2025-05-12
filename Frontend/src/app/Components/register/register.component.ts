import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { IconDirective } from '@coreui/icons-angular';
import { ContainerComponent, RowComponent, ColComponent, TextColorDirective, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, FormControlDirective, ButtonDirective, CardGroupComponent } from '@coreui/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegisterService } from 'app/Services/register.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { RouterLink } from '@angular/router';
import { User, UsersService } from 'app/Services/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule,
    FormsModule,
    ButtonDirective,
    ColComponent,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    InputGroupComponent,
    InputGroupTextDirective,
    IconDirective,
    FormControlDirective,
    CommonModule,
    ColComponent,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    InputGroupComponent,
    InputGroupTextDirective,
    IconDirective,
    FormControlDirective,
    ButtonDirective,
    CommonModule,
    RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit, OnDestroy{
  
  @Input() isEditMode: boolean = false; // false por defecto, en modo creación
  private subscription!: Subscription;
  selectedUser: User | null = null;
  registerForm!: FormGroup;
  errorMessage: string = '';
  passwordVisible: boolean = true;

  constructor(private fb: FormBuilder, private registerService: RegisterService, private userService:UsersService) {



   
  }

  ngOnInit(): void {
    
    // Se suscribe al observable para recibir el usuario seleccionado
    this.subscription = this.userService.selectedUser$.subscribe(user => {
      this.selectedUser = user;
      // Aquí puedes actualizar la UI o inicializar el formulario con los datos del usuario
      const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      this.registerForm = this.fb.group({
        username: ['', Validators.required],
        password: [this.isEditMode ? null :'',this.isEditMode ? [] :[Validators.required, Validators.minLength(8), Validators.pattern(strongPasswordPattern)]],
        confirmPassword: [this.isEditMode ? null : '', this.isEditMode ? [] : Validators.required],  
        email: ['', [Validators.required, Validators.email]],
        rol: ['', Validators.required],
        estado: ['I']
      }, {
        validators: this.passwordMatchValidator  // Asegúrate de que el validador personalizado esté aquí
      });
      // Suscribirse para recibir el usuario seleccionado
  this.subscription = this.userService.selectedUser$.subscribe(user => {
    this.selectedUser = user;
    if (this.isEditMode && user) {
      // Si estamos en modo edición y se recibe un usuario, actualiza el formulario con sus datos
      this.registerForm.patchValue({
        username: user.Username,
        email: user.Email,
        rol: user.Rol,
        estado: user.Estado
      });
    }
  });
    });
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
  
    // Si las contraseñas no coinciden, retorna un error, de lo contrario, null
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      return; // Evita el envío si el formulario no es válido
    }
    
    const formData = { ...this.registerForm.value };
  
    if (this.isEditMode) {
      // Si en modo edición la contraseña está vacía, eliminar esos campos
      if (!formData.password) {
        delete formData.password;
        delete formData.confirmPassword;
      }
  
      // Verificar que se haya seleccionado un usuario para actualizar
      if (!this.selectedUser) {
        console.error("No se ha seleccionado ningún usuario para editar.");
        return;
      }
      console.log("Datos enviados al backend:", formData);
      // Llama al endpoint de actualización (PUT /users/:id)
      this.userService.editUser(this.selectedUser.Id, formData).subscribe({
        next: (response) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'El usuario ha sido actualizado exitosamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#28a745',
          });
          this.registerForm.reset();
        },
        error: (err) => {
          this.errorMessage = err.message;
        }
      });
    } else {
      console.log("Datos enviados al backend:", formData);
      // Modo creación: se llama al endpoint de registro (POST /register)
      this.registerService.register(formData).subscribe({
        next: (response) => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'El usuario ha sido creado exitosamente.',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#28a745',
          });
          this.registerForm.reset();
        },
        error: (err) => {
          this.errorMessage = err.message;
        }
      });
    }
  }
}