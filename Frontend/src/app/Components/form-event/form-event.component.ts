import { CommonModule, NgStyle } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ButtonDirective, CardBodyComponent, CardComponent, CardGroupComponent, CardHeaderComponent, ColComponent, ContainerComponent,
  DropdownModule, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, FormControlDirective, FormDirective, FormFeedbackComponent,
  FormLabelDirective, FormSelectDirective, GridModule, InputGroupComponent, InputGroupTextDirective, ListGroupDirective, ListGroupItemDirective,
  RowComponent, TextColorDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { DpDatePickerModule } from 'ng2-date-picker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-form-event',
  standalone: true,
  imports: [NgStyle, MatDatepickerModule, MatNativeDateModule, DpDatePickerModule,
    DropdownModule, CommonModule, FormsModule, ReactiveFormsModule, GridModule, RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent,
    FormDirective, FormLabelDirective, FormControlDirective, FormFeedbackComponent, InputGroupComponent, InputGroupTextDirective,
    FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ListGroupDirective, ListGroupItemDirective,
    CardGroupComponent, ContainerComponent, IconDirective
  ],
  templateUrl: './form-event.component.html',
  styleUrls: ['./form-event.component.css'],
  providers: [CurrencyPipe] // Add CurrencyPipe here
})
export class FormEventComponent {

  selectedDate: any;
  form: FormGroup;
  showPrivadaSelect = false;
  showServicesSelect = true; // Mostrar el select de Services por defecto
  formattedTotal: string = ''; // Initialize formattedTotal

  constructor(private fb: FormBuilder, private currencyPipe: CurrencyPipe) {
    this.form = this.fb.group({
      fechaCreacion: ['', Validators.required],
      fechaVencimiento: ['', Validators.required],
      numero: ['', Validators.required],
      fechaCreacionHidden: ['', Validators.required],
      checkSer: [true, Validators.requiredTrue],
      checkPriv: [false, Validators.requiredTrue],
      diarioPrivada: ['', Validators.required],
      diarioServices: ['', Validators.required],
      tercero: ['', Validators.required],
      username: ['', Validators.required],
      city: ['', Validators.required],
      zip: ['', Validators.required],
      total: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]]
    }, { validator: this.dateRangeValidator });

    // Listen to changes in the checkboxes
    this.form.get('checkSer')?.valueChanges.subscribe((value: boolean) => {
      this.showServicesSelect = value;
      if (value) {
        this.form.get('checkPriv')?.setValue(false);
      }
    });

    this.form.get('checkPriv')?.valueChanges.subscribe((value: boolean) => {
      this.showPrivadaSelect = value;
      if (value) {
        this.form.get('checkSer')?.setValue(false);
      }
    });
    
    this.form.get('total')?.valueChanges.subscribe(value => {
      this.formattedTotal = this.formatCurrency(value);
    });
  }

  dateRangeValidator(group: FormGroup) {
    const fechaCreacion = group.get('fechaCreacion')?.value;
    const fechaVencimiento = group.get('fechaVencimiento')?.value;

    if (fechaCreacion && fechaVencimiento && new Date(fechaCreacion) > new Date(fechaVencimiento)) {
      group.get('fechaVencimiento')?.setErrors({ dateInvalid: true });
    } else {
      group.get('fechaVencimiento')?.setErrors(null);
    }

    return null;
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Form Submitted!', this.form.value);
    } else {
      console.log('Form is not valid');
    }
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
    // Remove currency symbol and thousands separators, then convert to number
    return parseFloat(value.replace(/[^0-9.-]+/g, ''));
  }
}
