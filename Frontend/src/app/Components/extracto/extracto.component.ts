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
import { ExtractoService } from '../../Services/extracto.service';
import { ExtractoDataService } from '../../Services/extracto-data.service';


@Component({
  selector: 'app-extracto',
  standalone: true,
  imports: [
    CommonModule,
    DataTablesModule,
    AlertComponent,
    ColComponent,
    FormControlDirective,
    RowComponent,
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
    GridModule,
    IconDirective],
  templateUrl: './extracto.component.html',
  styleUrl: './extracto.component.css'
})
export class ExtractoComponent implements OnInit, OnDestroy {

  dtOptions: Config = {};
  dtTrigger: Subject<void> = new Subject();

  data: any[] = [];

  addRecordModalVisible: boolean = false;
  uploadModalVisible: boolean = false;
  public selectedFile: File | null = null;
  public uploadMessage: string = '';
  public showAlert: boolean = false;

  constructor(
    private extractoService: ExtractoService,
    private ExtractoDataService: ExtractoDataService,
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

        this.ExtractoDataService.getDatos(params).subscribe({
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
        { data: 'fecha' },
        { data: 'descripcion'},
        { data: 'valor' },
        { data: 'saldo' },
        {
          data: null,
          orderable: false,
          render: (data: any) => {
            return `
              <div class="btn-group d-flex" role="group">
                <button type="button" class="btn btn-primary btn-m edit-btn" title="Editar" data-id="${data.id}">
                  <i class="cil-pencil"></i> 
                </button>
                <button type="button" class="btn btn-warning btn-m reschedule-btn" title="Reprogramar" data-id="${data.id}">
                  <i class="cil-calendar"></i> 
                </button>
                <button type="button" class="btn btn-danger btn-m inactivate-btn" title="Inactivar" data-id="${data.id}">
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
            this.onReschedule(id);
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
      this.extractoService.uploadFile(this.selectedFile).subscribe({
        next: (msg) => {
          this.uploadMessage = msg.message;
          this.showAlert = true;
          this.closeUploadModal();
        },
        error: (err) => {
          this.uploadMessage = 'Error de carga';
          this.showAlert = true;
          console.error('Error de carga', err);
          this.closeUploadModal();
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

  openUploadModal(): void {
    this.uploadModalVisible = true;
  }

  closeUploadModal(): void {
    this.uploadModalVisible = false;
  }

  handleAddRecordModalChange(visible: boolean): void {
    this.addRecordModalVisible = visible;
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
      // Lógica para editar el registro
    }
  }

  onInactivate(id: number): void {
    if (confirm('¿Estás seguro de que quieres inactivar este registro?')) {
      this.ExtractoDataService.inactivateRecord(id).subscribe({
        next: (response) => {
          alert('Registro inactivado exitosamente');
          this.reloadDataTable();
        },
        error: (err) => {
          console.error('Error al inactivar el registro', err);
        }
      });
    }
  }

  onReschedule(id: number): void {
    if (id !== -1) {
      console.log('Reprogramar registro con ID:', id);
      // Lógica para reprogramar el registro
    }
  }

  private reloadDataTable(): void {
    $('#dataTable').DataTable().ajax.reload();
  }
}
