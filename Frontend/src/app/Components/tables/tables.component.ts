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
  public selectedFile: File | null = null;
  public uploadMessage: string = '';
  public showAlert: boolean = false;

  constructor(
    private uploadService: UploadService,
    private dataService: DataService
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
        { data: 'fecha_factura' },
        { data: 'fecha_vencimiento' },
        { data: 'total' },
        { data: 'importe_adeudado' },
        { data: 'fecha_reprogramacion' },
        { data: 'cuenta_bancaria_numero' },
        { data: 'nuevo_pago' },
        { data: 'estado_pago' },
        {
          data: null,
          orderable: false,
          render: (data: any) => {
            return `
          <div class="btn-group" role="group">
              <button type="button" class="btn btn-success btn-sm reschedule-btn" title="Reprogramar" data-id="${data.id}">
                  <i class="cil-check"></i> 
              </button>
              <button type="button" class="btn btn-primary btn-sm edit-btn" title="Editar" data-id="${data.id}">
                  <i class="cil-pencil"></i> 
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
        // Bind event handlers to dynamically generated buttons
        document.querySelectorAll('.edit-btn').forEach((button) => {
          button.addEventListener('click', (event: any) => {
            const id = this.getRowDataId(event);
            this.onEdit(id);
          });
        });

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

  closeUploadModal(): void {
    this.uploadModalVisible = false;
  }

  handleAddRecordModalChange(visible: boolean): void {
    this.addRecordModalVisible = visible;
  }

  handleActModalChange(visible: boolean): void {
    this.ActModalVisible = visible;
  }

  handleUploadModalChange(visible: boolean): void {
    this.uploadModalVisible = visible;
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
    }
  }

  onInactivate(id: number): void {
    if (id !== -1) {
      console.log('Inactivar registro con ID:', id);
      // Implementar lógica para inactivar el registro
    }
  }
}
