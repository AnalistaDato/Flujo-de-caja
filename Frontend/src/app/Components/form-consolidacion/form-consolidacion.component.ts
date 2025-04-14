import { CommonModule, NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ButtonDirective, CardBodyComponent, CardComponent, CardGroupComponent, CardHeaderComponent, ColComponent, ContainerComponent,
  DropdownModule, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, FormControlDirective, FormDirective, FormFeedbackComponent,
  FormLabelDirective, FormSelectDirective, GridModule, InputGroupComponent, InputGroupTextDirective, ListGroupDirective, ListGroupItemDirective,
  RowComponent, TextColorDirective
} from '@coreui/angular';
import { IconDirective, IconModule } from '@coreui/icons-angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DataService, Factura } from '../../Services/data.service';
import { HttpParams } from '@angular/common/http';
import { CuentasService, Cuenta } from '../../Services/cuentas.service';
import { ConsolidadoService } from '../../Services/consolidado.service';
import { FacturaConsolidada, FacturasDateService } from '../../Services/facturas-date.service';


@Component({
  selector: 'app-form-consolidacion',
  standalone: true,
  imports: [MatDatepickerModule, MatNativeDateModule,
    DropdownModule, CommonModule, FormsModule, ReactiveFormsModule, GridModule, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent,
    FormDirective, FormLabelDirective, FormControlDirective,
    ButtonDirective,
    IconModule],
  templateUrl: './form-consolidacion.component.html',
  styleUrl: './form-consolidacion.component.css'
})
export class FormConsolidacionComponent {

  form: FormGroup = this.fb.group({});
  facturaData: FacturaConsolidada | null = null;
  cuentas: Cuenta[] = [];
  isLoading = false;
  error: any = null;

  constructor(private fb: FormBuilder, private facturadata_service: FacturasDateService) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre_socio: [],
      fecha: [{value: '', disable: true}],
      fecha_reprogramacion: [],
      detalle: [{ value: '', disabled: true }],
      debito: [''],
      credito: [''],
      saldo: [0], // Inicializa saldo en 0 o en su valor por defecto
      nuevo_pago: [0], // Añade nuevo_pago para evitar referencias null
      diferencia: [0], // Añade diferencia para evitar referencias null
      socio: [],
      banco: [],
      empresa: [],
      conf_banco: [] // Añade conf_banco ya que es referenciado en onSubmit
    });
    this.facturadata_service.selectedFactura$.subscribe(factura => {
      if (factura) {
        this.facturaData = factura;
        this.setFormValues(factura);
        this.setSaldo(); // Llama a la función que establece el saldo
      }
    });

    this.form.get('saldo')?.valueChanges.subscribe(() => {
      this.getSaldoDiferencia(); // Recalcula la diferencia cuando 'saldo' cambia
    });
  }
  setFormValues(factura: FacturaConsolidada): void {
    this.form.patchValue({
      nombre_socio: factura.socio,
      fecha: factura.fecha ? new Date(factura.fecha) : null,  // Convierte a Date si no es null
      fecha_reprogramacion: factura.fecha_reprogramacion ? new Date(factura.fecha_reprogramacion) : null,
      credito: factura.credito,
      debito: factura.debito,
      detalle: factura.detalle || '',
      empresa: factura.empresa || '',
    });
  }
  setSaldo(): void {
    const debito = this.form.get('debito')?.value || 0;
    const credito = this.form.get('credito')?.value || 0;
    const saldo = debito || credito; // Asigna el primer valor que no sea nulo
    this.form.patchValue({ saldo }); // Establece saldo en el formulario
  }
  getSaldoDiferencia(): string {
    const saldo = this.form.get('saldo')?.value || 0;
    const nuevoPago = this.form.get('nuevo_pago')?.value || 0;
    const diferencia = saldo - nuevoPago;

    this.form.get('diferencia')?.setValue(diferencia);
    return diferencia > 0
      ? `Saldo a favor: ${this.formatCurrency(diferencia)}`
      : `Saldo en contra: ${this.formatCurrency(Math.abs(diferencia))}`;
  }
  formatCurrency(value: number): string {
    // Utiliza el formato de moneda con solo la parte entera
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0, // No mostrar decimales
      maximumFractionDigits: 0  // Asegurar que no se muestren decimales
    }).format(Math.trunc(value)); // Truncar los decimales
  }
  onSubmit() {
    if (this.form.valid && this.facturaData) {
      // Extrae solo los campos necesarios para la actualización
      const updatedData = {
        id: Number(this.facturaData.id), // Asegúrate de incluir el ID de la factura
        fecha_reprogramacion: this.form.get('fecha_reprogramacion')?.value,
        nuevo_pago: this.parseCurrency(this.form.get('nuevo_pago')?.value),
        diferencia: this.form.get('diferencia')?.value
      };

      this.facturadata_service.editRecord(updatedData.id, updatedData).subscribe(
        (response) => {
          console.log('Factura actualizada con éxito', response);
          alert('Factura actualizada con éxito.');
          // Opcionalmente, navegar o resetear el formulario
        },
        (error) => {
          console.error('Error al actualizar la factura:', error);
          alert('No se pudo actualizar la factura. Por favor, inténtelo de nuevo más tarde.');
        }
      );
    } else {
      console.log('El formulario no es válido o falta facturaData');
      alert('Por favor, complete todos los campos requeridos.');
    }
  }
  parseCurrency(value: string | number): number {
    // Asegúrate de que 'value' sea una cadena
    if (typeof value === 'number') {
      return value; // Si ya es un número, solo retorna
    }

    // Si 'value' es una cadena, realiza el procesamiento
    if (typeof value === 'string') {
      // Elimina el símbolo de moneda y convierte el valor a número
      return parseFloat(value.replace(/[^0-9,-]+/g, '').replace(',', '.'));
    }

    // Si 'value' no es una cadena ni un número, retorna 0 o maneja el caso como desees
    return 0;
  }

  getSaldoPlaceholder(): string {
    const saldo = this.form.get('nuevo_pago')?.value;
    return saldo === 0 || saldo === null || saldo === '' ? this.formatCurrency(this.form.get('saldo')?.value || 0) : '';
  }
}


