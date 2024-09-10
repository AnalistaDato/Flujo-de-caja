import { CommonModule, NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ButtonDirective, CardBodyComponent, CardComponent, CardGroupComponent, CardHeaderComponent, ColComponent, ContainerComponent,
  DropdownModule, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, FormControlDirective, FormDirective, FormFeedbackComponent,
  FormLabelDirective, FormSelectDirective, GridModule, InputGroupComponent, InputGroupTextDirective, ListGroupDirective, ListGroupItemDirective,
  RowComponent, TextColorDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DataService, Factura } from '../../Services/data.service';
import { HttpParams } from '@angular/common/http';
import { CuentasService, Cuenta } from '../../Services/cuentas.service';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [NgStyle, MatDatepickerModule, MatNativeDateModule,
    DropdownModule, CommonModule, FormsModule, ReactiveFormsModule, GridModule, RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent,
    FormDirective, FormLabelDirective, FormControlDirective, FormFeedbackComponent, InputGroupComponent, InputGroupTextDirective,
    FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ListGroupDirective, ListGroupItemDirective,
    CardGroupComponent, ContainerComponent, IconDirective],
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})
export class FormComponent implements OnInit {

  form: FormGroup = this.fb.group({});
  facturaData: Factura | null = null;
  cuentas: Cuenta[] = [];
  isLoading = false;
  error: any = null;

  constructor(private fb: FormBuilder, private dataService: DataService, private cuentasService: CuentasService) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      fechaCreacion: [{ value: '', disabled: true }],
      fecha_reprogramacion: ['', Validators.required],
      saldo: [{ value: '', disabled: true }],
      nuevo_pago: ['', Validators.required],
      conf_banco: ['', Validators.required],
    });

    this.dataService.selectedFactura$.subscribe(factura => {
      if (factura) {
        this.facturaData = factura;
        this.loadCuentas(factura.empresa);
        this.form.patchValue({
          fechaCreacion: factura.fecha_factura || '',
          fecha_reprogramacion: factura.fecha_reprogramacion || '',
          saldo: factura.total || '',
          nuevo_pago: factura.nuevo_pago || '',
          conf_banco: factura.conf_banco || ''
        });
      }
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
      saldo: factura.importe_adeudado,
      nuevo_pago: factura.nuevo_pago,
      conf_banco: factura.conf_banco || ''
    });
  }

  onSubmit() {
    if (this.form.valid && this.facturaData) {
      const updatedData = {
        ...this.facturaData,
        ...this.form.value
      };

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
}
