import { CommonModule, NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ButtonDirective, CardBodyComponent, CardComponent, CardGroupComponent, CardHeaderComponent, ColComponent, ContainerComponent,
  DropdownModule, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, FormControlDirective, FormDirective, FormFeedbackComponent,
  FormLabelDirective, FormSelectDirective, GridModule, InputGroupComponent, InputGroupTextDirective, ListGroupDirective, ListGroupItemDirective,
  RowComponent, TabPanelComponent, TextColorDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { DpDatePickerModule } from 'ng2-date-picker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CurrencyPipe } from '@angular/common';
import { Cuenta, CuentasService } from '../../Services/cuentas.service';
import { DataService, Factura } from '../../Services/data.service';
import { cuentasContables, CuentasContablesService } from '../../Services/cuentas-contables.service';
import { provedores, ProvedoresService } from '../../Services/provedores.service';
import { TablesComponent } from '../tables/tables.component';

@Component({
  selector: 'app-form-event',
  standalone: true,
  imports: [
    NgStyle, MatDatepickerModule, MatNativeDateModule, DpDatePickerModule,
    DropdownModule, CommonModule, FormsModule, ReactiveFormsModule, GridModule,
    RowComponent, ColComponent, TextColorDirective, CardComponent,
    CardHeaderComponent, CardBodyComponent, FormDirective,
    FormLabelDirective, FormControlDirective, FormFeedbackComponent,
    InputGroupComponent, InputGroupTextDirective, FormSelectDirective,
    FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective,
    ButtonDirective, ListGroupDirective, ListGroupItemDirective, CardGroupComponent,
    ContainerComponent, IconDirective
  ],
  templateUrl: './form-event.component.html',
  styleUrls: ['./form-event.component.css'],
  providers: [CurrencyPipe],
})
export class FormEventComponent implements OnInit {

  selectedDate: any;
  form: FormGroup;
  showPrivadaSelect = false;
  showServicesSelect = true;
  formattedTotal: string = '';
  cuentas: Cuenta[] = [];
  provedores: provedores[] = [];
  isLoading = false;
  facturaData: Factura | null = null;
  CuentasContablesData: cuentasContables[] = [];
  errorMessage: string | null = null;
  error: any = null;
  showSuccessMessage: boolean = false;
  successMessage: string = '';
  opcionesPrivada = [{ value: 'ANT', label: '' },
  { value: 'ANT', label: 'ANTICIPOS' },
  { value: 'BNK0', label: 'BANCOLOMBIA corriente COP 1534' },
  { value: 'BNK1', label: 'BANCO POPULAR corriente COP 2781' },
  { value: 'BNK2', label: 'BBVA COLOMBIA corriente COP 2272' },
  { value: 'BNK3', label: 'BANCOLOMBIA t. credito COP 4430' },
  { value: 'BNK4', label: 'BBVA COLOMBIA corriente COP 2272' },
  { value: 'BNK5', label: 'BANCO CAJA SOCIAL corriente COP 7765' },
  { value: 'INTER', label: 'INTERCOMPAÑIAS' },
  { value: 'JEE', label: 'JEEVES TC' },
  { value: 'NO', label: 'NÓMINA' },
  { value: 'OF', label: 'OBLIGACIONES FINANCIERAS' },
  { value: 'DSD', label: 'DOCUMENTO SOPORTE DIAN' },
  { value: 'FC', label: 'FACTURA DE COMPRA' },
  { value: 'NCP', label: 'NOTA CRÉDITO PROVEEDORES' },
  { value: 'FV', label: 'FACTURA DE VENTA' },
  { value: 'NCC', label: 'NOTA CRÉDITO CLIENTES' }
  ]

  opcionesServices = [{ value: 'ANT', label: '' },
  { value: 'ANT', label: 'ANTICIPOS' },
  { value: 'BNK0', label: 'BANCOLOMBIA corriente COP 1541' },
  { value: 'BNK1', label: 'BANCO CAJA SOCIAL corriente COP 7828' },
  { value: 'BNK2', label: 'BANCOLOMBIA t. credito COP 4428' },
  { value: 'INTER', label: 'INTERCOMPAÑIAS' },
  { value: 'JEE', label: 'JEEVES TC' },
  { value: 'FC', label: 'FACTURA DE COMPRA' },
  { value: 'OF', label: 'OBLIGACIONES FINANCIERAS' },
  { value: 'DSD', label: 'DOCUMENTO SOPORTE DIAN' },
  { value: 'FV', label: 'FACTURA DE VENTA' },
  { value: 'NCC', label: 'NOTA CRÉDITO CLIENTES' }
  ]
  opcionesDiarios: Array<{ value: string, label: string }> = [];
  

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private currencyPipe: CurrencyPipe,
    private cuentasService: CuentasService,
    private cuentasContablesService: CuentasContablesService,
    private provedoresService: ProvedoresService,
    
  ) {
    this.form = this.fb.group({
      fechaCreacion: ['', Validators.required],
      fechaVencimiento: ['', Validators.required],
      checkSer: [true],
      checkPriv: [false],
      diario: ['', Validators.required], 
      provedor: ['', Validators.required],
      cuentaContable: ['', Validators.required],
      total: ['', [Validators.required, Validators.pattern(/^-?\d+(\.\d{1,2})?$/)]],
      conf_banco: ['', Validators.required]
    });
    this.opcionesDiarios = this.opcionesServices;

    // Escuchar cambios en el checkbox de Services
    this.form.get('checkSer')?.valueChanges.subscribe((value: boolean) => {
      if (value) {
        this.opcionesDiarios = this.opcionesServices;
        this.form.get('checkPriv')?.setValue(false);
        this.loadCuentas('Services');
        this.loadProvedores('Services');
      }
    });

    // Escuchar cambios en el checkbox de Privada
    this.form.get('checkPriv')?.valueChanges.subscribe((value: boolean) => {
      if (value) {
        this.opcionesDiarios = this.opcionesPrivada;
        this.form.get('checkSer')?.setValue(false);
        this.loadCuentas('Privada');
        this.loadProvedores('Privada');
      }
    });

    this.form.get('total')?.valueChanges.subscribe(value => {
      this.formattedTotal = this.formatCurrency(value);
    });

    this.loadCuentas('Services');
    this.loadProvedores('Services');
  }

  ngOnInit(): void {
    this.loadCuentasContables();
  }

  dateRangeValidator(group: FormGroup) {
    const fechaCreacion = group.get('fechaCreacion')?.value;
    const fechaVencimiento = group.get('fechaVencimiento')?.value;

    if (fechaCreacion && fechaVencimiento && new Date(fechaCreacion) > new Date(fechaVencimiento)) {
      group.get('fechaVencimiento')?.setErrors({ dateInvalid: true });
    } else {
      group.get('fechaVencimiento')?.setErrors(null);
    }
  }

  onSubmit() {
    if (this.form.valid) {
      let empresaValue = '';
        
      // Determine which empresa to send based on checkbox selection
      if (this.form.get('checkSer')?.value) {
          empresaValue = 'Services';
      } else if (this.form.get('checkPriv')?.value) {
          empresaValue = 'Privada';
      }
      const factura: Factura = {
        id: 0,  // Puedes establecer un ID adecuado o dejar 0 si el backend lo maneja
        numero: this.form.get('diario')?.value, 
        nombre_socio: this.form.get('provedor')?.value || '',
        fecha_factura: this.form.get('fechaCreacion')?.value,
        fecha_vencimiento: this.form.get('fechaVencimiento')?.value,
        actividades: '',  // Ajusta según lo que necesites
        importe_sin_impuestos: this.form.get('total')?.value,
        impuestos: this.form.get('total')?.value,
        total: this.form.get('total')?.value,
        total_en_divisa: this.form.get('total')?.value,
        importe_adeudado_sin_signo: 0,  // Ajusta según tu lógica
        estado_pago: 'pendiente',  // Ajusta según el estado que manejes
        estado_g: 'proyectado',   // Puedes cambiar esto según la lógica de negocio
        fecha_reprogramacion: '',  // Si tienes esta información
        created_at: new Date().toISOString(),  // Fecha de creación
        conf_banco: this.form.get('conf_banco')?.value,
        nuevo_pago: 0,  // Si tienes un campo de pago,
        cuenta_bancaria_numero: '',
        estado: 'Publicado',
        empresa: empresaValue,
        cuenta_contable: this.form.get('cuentaContable')?.value,
        diferencia: 0,  // Ajusta según lo que necesites
      };

      this.dataService.createRecord(factura).subscribe(
        (response) => {
          // Mostrar el mensaje de éxito que viene desde el backend
          this.successMessage = response.message || 'Registro subido con éxito';
          this.showSuccessMessage = true;

          // Ocultar el mensaje después de 5 segundos
          setTimeout(() => {
            this.showSuccessMessage = false;
          }, 5000);
        },
        (error) => {
          console.error('Error al crear el registro:', error);
          this.errorMessage = 'Error al crear el registro. Por favor, inténtelo nuevamente.';
        }
      );
    } else {
      this.validateAllFormFields(this.form);
      this.errorMessage = 'Por favor, corrija los errores en el formulario antes de enviar.';
    }
  }

  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      } else {
        control?.markAsTouched({ onlySelf: true });
      }
    });
  }

  onTotalChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = this.parseCurrency(input.value);
    this.form.get('total')?.setValue(value, { emitEvent: false });
  }

  formatCurrency(value: number | null): string {
    if (value === null || value === undefined) return '';
    return this.currencyPipe.transform(value, 'USD', 'symbol', '1.2-2') || '';
  }

  parseCurrency(value: string): number {
    return parseFloat(value.replace(/[^0-9.-]+/g, ''));
  }

  loadCuentasContables(): void {
    this.cuentasContablesService.getCuentasContables().subscribe(
      (data: cuentasContables[]) => {
        this.CuentasContablesData = data;
      },
      (error) => {
        console.error('Error al cargar cuentas bancarias', error);
        this.isLoading = false;
      }
    );
  }

  loadCuentas(empresa: string): void {
    this.isLoading = true;
    this.cuentasService.getDatos(empresa).subscribe(
      (data: Cuenta[]) => {
        this.cuentas = data;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error al cargar cuentas bancarias', error);
        this.isLoading = false;
      }
    );
  }

  loadProvedores(empresa: string): void {
    this.provedoresService.getPriovedores(empresa).subscribe(
      (data: provedores[]) => {
        this.provedores = data;
      },
      (error) => {
        console.error('Error al cargar los provedores', error);
      }
    );
  }

  populateFormWithFacturaData(): void {
    if (this.facturaData) {
      this.form.patchValue({
        fechaCreacion: this.facturaData.fecha_factura,
        fechaVencimiento: this.facturaData.fecha_vencimiento,
        numero: this.facturaData.numero,
        total: this.facturaData.total,
        cuentaContable: this.facturaData.cuenta_contable,
        conf_banco: this.facturaData.conf_banco,
        provedor: this.facturaData.empresa,
      });

      // Formatear el total
      this.formattedTotal = this.formatCurrency(this.facturaData.total);
    }
  }
  

}
