import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertComponent, ColComponent, FormControlDirective, RowComponent, ModalComponent, ModalHeaderComponent, ModalTitleDirective, ThemeDirective, ButtonCloseDirective, ModalBodyComponent, ModalFooterComponent, ButtonGroupComponent, ButtonDirective, ContainerComponent, GridModule } from '@coreui/angular';
import { IconModule, IconDirective } from '@coreui/icons-angular';
import { DataTablesModule } from 'angular-datatables';
import { FormEventComponent } from '../form-event/form-event.component';
import { FormComponent } from '../form/form.component';
import { Config } from 'datatables.net-bs5';
import { Subject } from 'rxjs';
import { User, UsersService } from 'app/Services/users.service';
import { HttpParams } from '@angular/common/http';
import { RegisterComponent } from "../register/register.component";

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    DataTablesModule,
    AlertComponent,
    ColComponent,
    RowComponent,
    IconModule,
    ButtonDirective,
    ContainerComponent,
    GridModule,
    IconDirective,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    RegisterComponent,
    CommonModule,
    DataTablesModule,
    AlertComponent,
    ColComponent,
    RowComponent,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ThemeDirective,
    ButtonCloseDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    IconModule,
    ButtonDirective,
    GridModule,
    IconDirective
],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit, OnDestroy {

  dtOptions: Config = {};
  dtTrigger: Subject<void> = new Subject();

  data: User[] = [];


  AddUserVisible: boolean = false;
  public selectedFile: File | null = null;
  public uploadMessage: string = '';
  public showAlert: boolean = false;

  constructor(private UsersService: UsersService) {

  }

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

        this.UsersService.getDatos(params).subscribe({
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
        { data: 'Id' },
        { data: 'Username' },
        { data: 'Email' },
        { data: 'Rol' },
        {
          data: 'Estado',
          render: (data: string) => {
            if (data === 'I') {
              return `<span class="badge bg-danger">Inactivo</span>`;
            } else if (data === 'A') {
              return `<span class="badge bg-success">Activo</span>`;
            }
            return data;
          }
        },
        {
          data: null,
          orderable: false,
          render: (data: any) => {
            if (data.Estado === 'I') {
              return `
                
                  <button type="button" class="btn btn-success btn-m activate-btn" title="Activar" data-Id="${data.Id}">
                    <i class="cil-check"></i> Activar
                  </button>
             
              `;
            } else if (data.Estado === 'A') {
              return `
                <div class="btn-group d-flex" role="group">
                  <button type="button" class="btn btn-warning btn-sm edit-btn" title="Editar" data-Id="${data.Id}">
                    <i class="cil-pencil"></i> Editar
                  </button>
                  <button type="button" class="btn btn-danger btn-sm inactivate-btn" title="Inactivar" data-Id="${data.Id}">
                    <i class="cil-ban"></i> Inactivar
                  </button>
                </div>
              `;
            }
            return '';
          }
        }
      ],
      order: [[0, 'asc']],
      drawCallback: () => {
        document.querySelectorAll('.inactivate-btn').forEach((button) => {
          button.addEventListener('click', (event: any) => {
            const Id = this.getRowDataId(event);
            this.onInactivate(Id);
          });
        });

        document.querySelectorAll('.activate-btn').forEach((button) => {
          button.addEventListener('click', (event: any) => {
            const Id = this.getRowDataId(event);
            this.onActivate(Id);
          });
        });

        // Manejamos también el botón de adicionar si es necesario
        document.querySelectorAll('.edit-btn').forEach((button) => {
          button.addEventListener('click', (event: any) => {
            const Id = this.getRowDataId(event);
            this.editAddUserModal(Id);
          });
        });
      }
    };

    this.dtTrigger.next();
  }


  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }
  reloadTableData(): void {
    this.dtTrigger.next();
  }

  getRowDataId(event: any): number {
    const Id = event.currentTarget.getAttribute('data-Id');
    return parseInt(Id, 10) || -1; // Provide a default value if 'Id' is not found
  }
  onInactivate(Id: number): void {
    if (Id !== -1) {
      const confirmed = window.confirm('¿Estás seguro de que deseas inactivar este registro? Esta acción no se puede deshacer.');

      if (confirmed) {
        console.log('Inactivar registro con ID:', Id);

        // Llamada al servicio para inactivar el registro
        this.UsersService.updateUserStatus(Id, 'I').subscribe({
          next: (response) => {
            console.log('Factura inactivada con éxito:', response.message);
            this.reloadTableData(); // Recargar la tabla después de la inactivación
          },
          error: (error) => {
            console.error('Error al inactivar el usuario:', error);
          }
        });
      } else {
        console.log('Inactivación cancelada por el usuario.');
      }
    }
  }
  onActivate(Id: number): void {
    if (Id !== -1) {
      const confirmed = window.confirm('¿Estás seguro de que deseas activar este registro?');

      if (confirmed) {
        console.log('Activar registro con ID:', Id);

        // Llamada al servicio para activar el registro (cambiando el estado a 'A')
        this.UsersService.updateUserStatus(Id, 'A').subscribe({
          next: (response) => {
            console.log('Usuario activado con éxito:', response.message);
            this.reloadTableData(); // Recargar la tabla después de la activación
          },
          error: (error) => {
            console.error('Error al activar el usuario:', error);
          }
        });
      } else {
        console.log('Activación cancelada por el usuario.');
      }
    }
  }

  editAddUserModal(Id: number): void {
   // Llama al servicio para obtener la factura por ID
       this.UsersService.getUserById(Id).subscribe({
         next: (user: User) => {
           // Setea el usurio seleccionada en el servicio
           this.UsersService.setSelectedUser(user);
   
           // Abre el modal
           this.AddUserVisible = true;
         },
         error: (err) => {
           console.error('Error al obtener el usuario:', err);
         }
       });
  }
  openAddUserModal(){
    this.AddUserVisible = true;
  }

  closeAddRecordModal(): void {
    this.AddUserVisible = false;
  }

  handleAddUserModalChange(visible: boolean): void {
    this.AddUserVisible = visible;
    if (!visible) {
      // Si el modal se cierra después de agregar un registro, recargar la tabla
      this.reloadTableData();
    }
  }



}
