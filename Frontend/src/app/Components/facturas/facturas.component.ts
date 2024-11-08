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
import { MasivoService } from '../../Services/masivo.service';
import { FormConsolidacionComponent } from '../form-consolidacion/form-consolidacion.component';

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [
    FormConsolidacionComponent,
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
  uploadModalVisibleMasivo: boolean = false;
  ActModalVisible: boolean = false;
  CcModalVisible: boolean = false;
  public selectedFile: File | null = null;
  public selectedFileMasiva: File | null = null;
  public uploadMessageMasivo: string = '';
  public uploadMessage: string = '';
  public showAlert: boolean = false;

  constructor(
    private facturasService: FactrurasService,
    private facturas_dataService: FacturasDateService,
    private masivoService: MasivoService
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
          data: 'empresa',
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
        document.querySelectorAll('.inactivate-btn').forEach((button) => {
          button.addEventListener('click', (event: any) => {
            const id = this.getRowDataId(event);
            this.onInactivate(id);
          });
        });
        document.querySelectorAll('.reschedule-btn').forEach((button) => {
          button.addEventListener('click', (event: any) => {
            const id = this.getRowDataId(event);
            this.openActModal(id); // Open the modal when the check button is clicked
          });
        });


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
  openUploadModalMasivo(): void {
    this.uploadModalVisibleMasivo = true;
  }
  closeUploadModal(): void {
    this.uploadModalVisible = false;
  }
  closeUploadModalMasivo(): void {
    this.uploadModalVisibleMasivo = false;
  }
  handleUploadModalChange(visible: boolean): void {
    this.uploadModalVisible = visible;
    if (!visible) {
      this.uploadMessage = '';
    }
  }
  handleUploadModalChangeMasivo(visible: boolean): void {
    this.uploadModalVisibleMasivo = visible;
    if (!visible) {
      this.uploadMessage = '';
    }
  }
  onFileSelectedMasivo(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileMasiva = file;
    }
  }
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }
  getRowDataId(event: any): number {
    const id = event.currentTarget.getAttribute('data-id');
    return parseInt(id, 10) || -1; // Provide a default value if 'id' is not found
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

  openActModal(id: number): void {
    // Llama al servicio para obtener la factura por ID
    this.facturas_dataService.getFacturaById(id).subscribe({
      next: (factura: FacturaConsolidada) => {
        // Setea la factura seleccionada en el servicio
        this.facturas_dataService.setSelectedFactura(factura);

        // Abre el modal
        this.ActModalVisible = true;
      },
      error: (err) => {
        console.error('Error al obtener la factura:', err);
      }
    });
  }
  handleActModalChange(visible: boolean): void {
    this.ActModalVisible = visible;
    if (!visible) {
      // Recargar los datos de la tabla cuando se cierre el modal de reprogramar
      this.reloadTableData();
    }
  }
  closeActdModal(): void {
    this.ActModalVisible = false;

  }


  onInactivate(id: number): void {
    if (id !== -1) {
      const confirmed = window.confirm('¿Estás seguro de que deseas inactivar este registro? Esta acción no se puede deshacer.');

      if (confirmed) {
        console.log('Inactivar registro con ID:', id);

        // Llamada al servicio para inactivar el registro
        this.facturas_dataService.inactivateRecord(id).subscribe({
          next: (response) => {
            console.log('Factura inactivada con éxito:', response.message);
            // Recargar los datos de la tabla después de inactivar
          },
          error: (error) => {
            console.error('Error al inactivar la factura:', error);
          }
        });
      } else {
        console.log('Inactivación cancelada por el usuario.');
      }
    }
    this.reloadTableData();
  }

  reloadTableData(): void {
    this.dtTrigger.next();
  }

  onUploadMasivo(): void {
    if (this.selectedFileMasiva) {
      this.masivoService.uploadFile(this.selectedFileMasiva).subscribe({
        next: (msg) => {
          this.uploadMessageMasivo = msg.message;
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
