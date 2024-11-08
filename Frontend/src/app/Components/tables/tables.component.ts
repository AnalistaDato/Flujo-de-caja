import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { DataService } from '../../Services/data.service';
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
import 'datatables.net-bs5';
import { UploadService } from '../../Services/upload.service';
import { CuentasContablesService } from '../../Services//cuentas-contables.service';
import { Config } from 'datatables.net-bs5';
import { HttpParams } from '@angular/common/http';
import { FormEventComponent } from '../form-event/form-event.component';
import { FormComponent } from '../form/form.component';
import { Factura } from '../../Services/data.service'; // Asegúrate de importar Factura si está en otro archivo

@Component({
  selector: 'app-tables',
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
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.css']
})
export class TablesComponent implements OnInit, OnDestroy {

  dtOptions: Config = {};
  dtTrigger: Subject<void> = new Subject();

  data: Factura[] = [];

  addRecordModalVisible: boolean = false;
  uploadModalVisible: boolean = false;
  ActModalVisible: boolean = false;
  CcModalVisible: boolean = false;
  public selectedFile: File | null = null;
  public uploadMessage: string = '';
  public showAlert: boolean = false;

  constructor(
    private uploadService: UploadService,
    private dataService: DataService,
    private CuentasContablesService: CuentasContablesService
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

        this.dataService.getDatos(params).subscribe({
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
        { data: 'numero' },
        { data: 'nombre_socio' },
        {
          data: 'fecha_factura',
          render: (data: string) => this.formatDate(data) // Format date
        },
        {
          data: 'fecha_vencimiento',
          render: (data: string) => this.formatDate(data) // Format date 

        },
        {
          data: 'total',
          render: (data: number) => this.formatCurrency(data) // Format currency
        },
        {
          data: 'importe_adeudado',
          render: (data: number) => this.formatCurrency(data) // Format currency
        },
        {
          data: 'fecha_reprogramacion',
          render: (data: string) => this.formatDate(data) // Format date
        },
        { data: 'cuenta_bancaria_numero' },
        {
          data: 'nuevo_pago',
          render: (data: number) => this.formatCurrency(data) // Format currency
        },
        { data: 'estado_pago' },
        { data: 'cuenta_contable' },
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

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onUpload(): void {
    if (this.selectedFile) {
      this.uploadService.uploadFile(this.selectedFile).subscribe({
        next: (msg) => {
          this.uploadMessage = msg.message;
          this.showAlert = true;
          this.reloadTableData();  // Recargar los datos de la tabla después de subir el archivo
        },
        error: (err) => {
          this.uploadMessage = 'Error de carga';
          this.showAlert = true;
          console.error('Error de carga', err);
        }
      });
    }
  }

  onUploadCc(): void {
    if (this.selectedFile) {
      this.CuentasContablesService.uploadFile(this.selectedFile).subscribe({
        next: (msg) => {
          this.uploadMessage = msg.message;
          this.showAlert = true;
          this.reloadTableData();  // Recargar los datos de la tabla después de subir el archivo
        },
        error: (err) => {
          this.uploadMessage = 'Error de carga';
          this.showAlert = true;
          console.error('Error de carga', err);
        }
      });
    }
  }

  openAddRecordModal(): void {
    this.addRecordModalVisible = true;
  }

  closeAddRecordModal(): void {
    this.addRecordModalVisible = false;
  }

  openActModal(id: number): void {
    // Llama al servicio para obtener la factura por ID
    this.dataService.getFacturaById(id).subscribe({
      next: (factura: Factura) => {
        // Setea la factura seleccionada en el servicio
        this.dataService.setSelectedFactura(factura);

        // Abre el modal
        this.ActModalVisible = true;
      },
      error: (err) => {
        console.error('Error al obtener la factura:', err);
      }
    });
  }

  closeActdModal(): void {
    this.ActModalVisible = false;

  }

  openUploadModal(): void {
    this.uploadModalVisible = true;
  }

  openCcModal(): void {
    this.CcModalVisible = true;
  }

  closeUploadModal(): void {
    this.uploadModalVisible = false;
  }

  closeCcModal(): void {
    this.CcModalVisible = false;
  }

  handleAddRecordModalChange(visible: boolean): void {
    this.addRecordModalVisible = visible;
    if (!visible) {
      // Si el modal se cierra después de agregar un registro, recargar la tabla
      this.reloadTableData();
    }
  }

  handleActModalChange(visible: boolean): void {
    this.ActModalVisible = visible;
    if (!visible) {
      // Recargar los datos de la tabla cuando se cierre el modal de reprogramar
      this.reloadTableData();
    }
  }

  handleUploadModalChange(visible: boolean): void {
    this.uploadModalVisible = visible;
    if (!visible) {
      this.uploadMessage = '';
    }
  }

  handleCcModalChange(visible: boolean): void {
    this.CcModalVisible = visible;
    if (!visible) {
      this.uploadMessage = '';
    }
  }

  getRowDataId(event: any): number {
    const id = event.currentTarget.getAttribute('data-id');
    return parseInt(id, 10) || -1; // Provide a default value if 'id' is not found
  }

  onEdit(id: number): void {
    if (id !== -1) {
      console.log('Editar registro con ID:', id);
      // Implementar lógica para editar el registro
      // Después de editar, recargar los datos de la tabla
      this.reloadTableData();
    }
  }

  onInactivate(id: number): void {
    if (id !== -1) {
      const confirmed = window.confirm('¿Estás seguro de que deseas inactivar este registro? Esta acción no se puede deshacer.');

      if (confirmed) {
        console.log('Inactivar registro con ID:', id);

        // Llamada al servicio para inactivar el registro
        this.dataService.inactivateRecord(id).subscribe({
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }
  formatDate(date: string): string {
    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString('es-CO');
  }

  reloadTableData(): void {
    this.dtTrigger.next();
  }
  onUpdateToConsolidado(id: number): void {
    this.dataService.updateToConsolidado(id).subscribe({
      next: (response) => {
        console.log('Registro actualizado a consolidado:', response);
        this.reloadTableData();
      },
      error: (err) => {
        console.error('Error al actualizar a consolidado:', err);
      }
    });
  }




}
