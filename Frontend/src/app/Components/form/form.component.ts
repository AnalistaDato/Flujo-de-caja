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
import { TablesComponent } from '../tables/tables.component';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [NgStyle, MatDatepickerModule, MatNativeDateModule,
    DropdownModule, CommonModule, FormsModule, ReactiveFormsModule, GridModule, RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent,
    FormDirective, FormLabelDirective, FormControlDirective, FormFeedbackComponent, InputGroupComponent, InputGroupTextDirective,
    FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ListGroupDirective, ListGroupItemDirective,
    CardGroupComponent, ContainerComponent, IconDirective, IconModule],
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {

  form: FormGroup = this.fb.group({});
  facturaData: Factura | null = null;
  cuentas: Cuenta[] = [];
  isLoading = false;
  error: any = null;
  filtrados: any[] = []; // Variable para almacenar los datos filtrados;  // Aquí almacenaremos los datos de consolidado
  selectedIds: Set<number> = new Set<number>(); // IDs seleccionado

  constructor(private fb: FormBuilder, private dataService: DataService, private cuentasService: CuentasService, private consolidadoService: ConsolidadoService, private tablesComponent: TablesComponent) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      fechaCreacion: [{ value: '', disabled: true }],
      fecha_reprogramacion: [''],
      saldo: [{ value: '', disabled: true }],
      nuevo_pago: ['', Validators.required],
      conf_banco: ['', Validators.required],
      valor: ['', []],
      fecha: [this.getFirstDayOfMonth(), []],
      tolerancia: ['', []],
      diferencia: []
    });

    this.dataService.selectedFactura$.subscribe(factura => {
      if (factura) {
        this.facturaData = factura;
        this.loadCuentas(factura.empresa);
        this.setFormValues(factura);
      }
    });
    this.form.get('nuevo_pago')?.valueChanges.subscribe(() => {
      this.getSaldoDiferencia(); // Recalcula la diferencia cuando 'nuevo_pago' cambia
    });
  
    this.form.get('saldo')?.valueChanges.subscribe(() => {
      this.getSaldoDiferencia(); // Recalcula la diferencia cuando 'saldo' cambia
    });
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

  onNumeroSelected(numero: string) {
    this.dataService.getDatos(new HttpParams().set('numero', numero)).subscribe(
      (response) => {
        if (response && response.data && response.data.length > 0) {
          const factura = response.data[0];
          this.setFormValues(factura);
          this.loadCuentas(factura.empresa);
        } else {
          alert('No se encontró la factura con el número seleccionado.');
        }
      },
      (error) => {
        console.error('Error al obtener la factura:', error);
        alert('No se pudo obtener la factura. Por favor, inténtelo de nuevo más tarde.');
      }
    );
  }

  setFormValues(factura: Factura): void {
    this.form.patchValue({
      fechaCreacion: factura.fecha_factura,
      fecha_reprogramacion: factura.fecha_reprogramacion || '',
      saldo: factura.total,
      nuevo_pago: factura.nuevo_pago,
      conf_banco: factura.conf_banco || '',
      valor: factura.total,
      fecha: this.getFirstDayOfMonth(),
      diferencia: factura.diferencia,
    });
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
      const updatedData = {
        ...this.facturaData,
        ...this.form.value
      };

      // Convierte los valores de vuelta a números antes de enviar
      updatedData.importe_adeudado = this.parseCurrency(updatedData.importe_adeudado);
      updatedData.nuevo_pago = this.parseCurrency(updatedData.nuevo_pago);

      this.dataService.editRecord(this.facturaData.id, updatedData).subscribe(
        (response) => {
          console.log('Factura actualizada con éxito', response);
          alert('Factura actualizada con éxito.');
          // Optionally, navigate away or reset the form
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

  loadConsolidado(): void {
    const params = new HttpParams().set('id', this.facturaData?.numero || '');

    this.consolidadoService.getDatos(params).subscribe(
      (response) => {
        this.filtrados = response.data; // Guardamos los datos del consolidado
        console.log('Datos de consolidado cargados', this.filtrados);
      },
      (error) => {
        console.error('Error al cargar consolidado:', error);
        alert('No se pudieron cargar los datos del consolidado.');
      }
    );
  }

  onConsolidar(): void {
    this.loadConsolidado();
    const valorControl = this.form.get('valor');
    const fechaControl = this.form.get('fecha');

    if (valorControl?.valid && fechaControl?.valid) {
      const params = new HttpParams()
        .set('valor', valorControl?.value)
        .set('fecha', fechaControl?.value)
        .set('tolerancia', this.form.get('tolerancia')?.value || ''); // Asegúrate de que todos los valores son correctos

      this.consolidadoService.getDatos(params).subscribe(
        (response) => {
          if (response && response.data) {
            this.filtrados = response.data; // Guardamos los datos filtrados
            console.log('Datos filtrados cargados', this.filtrados);
          } else {
            console.log('No se encontraron datos para los filtros proporcionados.');
            alert('No se encontraron datos para los filtros proporcionados.');
          }
        },
        (error) => {
          console.error('Error al cargar datos filtrados:', error);
          alert('No se pudieron cargar los datos filtrados.');
        }
      );
    } else {
      alert('Por favor, ingrese valores válidos para el rango y la fecha.');
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

  getFirstDayOfMonth(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
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

  // Función para manejar el cambio de un checkbox
  onCheckboxChange(event: Event, id: number): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedIds.add(id); // Agregar ID seleccionado
    } else {
      this.selectedIds.delete(id); // Remover ID si es deseleccionado
    }
    console.log('Selected IDs:', Array.from(this.selectedIds)); // Mostrar los IDs seleccionados
  }

  // Función para seleccionar o deseleccionar todos los checkboxes
  toggleSelectAll(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.filtrados.forEach(item => this.selectedIds.add(item.id));
    } else {
      this.selectedIds.clear();
    }
    console.log('Selected IDs (all):', Array.from(this.selectedIds));
  }
  onCloseModal(): void {
    // Resetear los valores de los campos de fecha y tolerancia
    this.form.patchValue({
      fecha_reprogramacion: '',
      fecha: '',
      tolerancia: ''
    });

    // Resetear los filtros también
    this.filtrados = [];
    this.selectedIds.clear();
  }
  // Lógica para actualizar el estado de los elementos seleccionados
  updateSelectedStatus(): void {
    if (this.selectedIds.size === 0) {
      alert('No hay elementos seleccionados.');
      return;
    }

    // Llamada al servicio para actualizar los estados de los IDs seleccionados
    this.ejecutarUpdateStatus();
    this.consolidadoService.updateStatus(Array.from(this.selectedIds)).subscribe(
      (response) => {
        console.log('Estado actualizado con éxito', response);
        alert('Estado actualizado con éxito.');
        this.selectedIds.clear(); // Limpiar la selección después de la actualización
      },
      (error) => {
        console.error('Error al actualizar el estado:', error);
        alert('Hubo un error al actualizar el estado. Por favor, inténtelo de nuevo.');
      }
    );
  }
  ejecutarUpdateStatus(): void {
    if (this.facturaData?.id !== undefined) {
      this.tablesComponent.onUpdateToConsolidado(this.facturaData.id);

    } else {
      console.error('ID is undefined');
      alert('El ID de la factura no está definido.');
    }
    this.tablesComponent.closeActdModal()
  }
}
