import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { DataTablesModule } from 'angular-datatables';
import { CommonModule } from '@angular/common';
import {
  AlertComponent,
  ButtonCloseDirective,
  ButtonDirective,
  ButtonGroupComponent,
  ColComponent,
  ContainerComponent,
  FormCheckComponent,
  FormCheckInputDirective,
  FormControlDirective,
  FormDirective,
  FormSelectDirective,
  GridModule,
  InputGroupComponent,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  RowComponent,
  ThemeDirective
} from '@coreui/angular';
import { IconModule, IconDirective } from '@coreui/icons-angular';
import { Config } from 'datatables.net-bs5';
import { HttpParams } from '@angular/common/http';
import { FormEventComponent } from '../form-event/form-event.component';
import { FormComponent } from '../form/form.component';
import { FactrurasService } from '../../Services/factruras.service';
import { FacturaConsolidada, FacturasDateService } from '../../Services/facturas-date.service';

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [
    FormComponent,
    FormEventComponent,
    CommonModule,
    DataTablesModule,
    AlertComponent,
    FormCheckComponent,
    FormCheckInputDirective,
    ColComponent,
    FormControlDirective,
    InputGroupComponent,
    FormSelectDirective,
    RowComponent,
    FormDirective,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ThemeDirective,
    ButtonCloseDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    IconModule,
    ButtonGroupComponent,
    ButtonDirective,
    ContainerComponent,
    GridModule,
    IconDirective
  ],
  templateUrl: './facturas.component.html',
  styleUrl: './facturas.component.css'
})
export class FacturasComponent implements OnInit, OnDestroy {
  dtOptions: Config = {};
  dtTrigger: Subject<void> = new Subject();

  data: FacturaConsolidada[] = [];

  addRecordModalVisible: boolean = false;
  uploadModalVisible: boolean = false;
  ActModalVisible: boolean = false;
  CcModalVisible: boolean = false;
  public selectedFile: File | null = null;
  public uploadMessage: string = '';
  public showAlert: boolean = false;

  constructor(
    private facturasService: FactrurasService,
    private facturas_dataService: FacturasDateService
  ) { }

  ngOnInit(): void {
    this.dtOptions = {
      processing: true,
      serverSide: true,
      ajax: (dataTablesParams: any, callback: any) => {
        const params = new HttpParams()
          .set('draw', dataTablesParams.draw)
          .set('start', dataTablesParams.start)
          .set('length', dataTablesParams.length)
          .set('search', dataTablesParams.search.value || '')
          .set('order', JSON.stringify(dataTablesParams.order))
          .set('columns', JSON.stringify(dataTablesParams.columns));

        this.facturas_dataService.getDatos(params).subscribe({
          next: (response: any) => {
            this.data = response.data; // Populate the data property
            callback({
              draw: dataTablesParams.draw,
              recordsTotal: response.recordsTotal,
              recordsFiltered: response.recordsFiltered,
              data: response.data
            });
          },
          error: (err) => {
            console.error('Error en la solicitud AJAX:', err);
          }
        });
      },
      columns: [
        { data: 'id' },
        { data: 'factura' },
        {
          data: 'fecha',
          render: (data: string) => this.formatDate(data) // Format date
        },
        { data: 'cuenta' },
        { data: 'detalle' },
        {
          data: 'debito',
          render: (data: number) => this.formatCurrency(data) // Format currency
        },
        {
          data: 'credito',
          render: (data: number) => this.formatCurrency(data) // Format currency
        },
        {
          data: 'socio',
        },
        {
          data: 'banco',
        },
        {
          data: null,
          orderable: false,
          render: (data: any) => {
            return `
          <div class="btn-group" role="group">
              <button type="button" class="btn btn-success btn-sm reschedule-btn" title="Reprogramar" data-id="${data.id}">
                  <i class="cil-check"></i> 
              </button>
              <button type="button" class="btn btn-danger btn-sm inactivate-btn" title="Inactivar" data-id="${data.id}">
                  <i class="cil-ban"></i> 
              </button>
          </div>
            `;
          }
        }
      ],
      order: [[0, 'asc']],
      drawCallback: () => {
      }
    };

    this.dtTrigger.next();
  }
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }
  formatDate(date: string): string {
    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString('es-CO');
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }
  openUploadModal(): void {
    this.uploadModalVisible = true;
  }
  closeUploadModal(): void {
    this.uploadModalVisible = false;
  }
  handleUploadModalChange(visible: boolean): void {
    this.uploadModalVisible = visible;
    if (!visible) {
      this.uploadMessage = '';
    }
  }
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onUpload(): void {
    if (this.selectedFile) {
      this.facturasService.uploadFile(this.selectedFile).subscribe({
        next: (msg) => {
          this.uploadMessage = msg.message;
          this.showAlert = true;
          
        },
        error: (err) => {
          this.uploadMessage = 'Error de carga';
          this.showAlert = true;
          console.error('Error de carga', err);
        }
      });
    }
  }

}
