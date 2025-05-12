import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { DataTablesModule } from 'angular-datatables';
import { NotificacionService, FacturaConsolidada } from 'app/Services/notificacion.service';
import * as XLSX from 'xlsx';
import 'datatables.net-bs5';
import { Config } from 'datatables.net-bs5';
import { AlertComponent, ColComponent, FormControlDirective, RowComponent, ModalComponent, ModalHeaderComponent, ModalTitleDirective, ThemeDirective, ButtonCloseDirective, ModalBodyComponent, ModalFooterComponent, ButtonGroupComponent, ButtonDirective, GridModule } from '@coreui/angular';
import { IconModule, IconDirective } from '@coreui/icons-angular';
import { FormEventComponent } from '../form-event/form-event.component';
import { FormComponent } from '../form/form.component';
import { HttpParams } from '@angular/common/http';
@Component({
  selector: 'app-notificacion',
  standalone: true,
  imports: [FormComponent,
    FormEventComponent,
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
  templateUrl: './notificacion.component.html',
  styleUrl: './notificacion.component.css'
})
export class NotificacionComponent implements OnInit, OnDestroy {
  dtOptions: Config = {};
  dtTrigger: Subject<void> = new Subject();
  notificaciones: FacturaConsolidada[] = [];

  constructor(private notificacionService: NotificacionService) { }

  ngOnInit(): void {
    this.dtOptions = {
      paging: true,
      searching: true,
      ordering: true,
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

        this.notificacionService.getDatos(params).subscribe({
          next: (response: any) => {
            this.notificaciones = response.data; // Populate the data property
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
          data: 'fecha_reprogramacion',
          render: (data: string) => this.formatDate(data)
        },
        {
          data: 'total_en_divisa',
          render: (data: number) => this.formatCurrency(data) // Format currency
        },
        {
          data: 'importe_adeudado_sin_signo',
          render: (data: number) => this.formatCurrency(data) // Format currency
        },
        {
          data: 'nuevo_pago',
          render: (data: number) => this.formatCurrency(data) // Format currency
        },
        { data: 'empresa' },
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


        document.querySelectorAll('.reschedule-btn').forEach((button) => {
          button.addEventListener('click', (event: any) => {
            const id = this.getRowDataId(event);
          });
        });
      }
    };


    this.notificacionService.notificaciones$.subscribe(data => {
      this.notificaciones = data;
      this.dtTrigger.next();
    });
  }



  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }

  getRowDataId(event: any): number {
    const id = event.currentTarget.getAttribute('data-id');
    return parseInt(id, 10) || -1; // Provide a default value if 'id' is not found
  }

  exportToExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.notificaciones.map(factura => ({
      ID: factura.id,
      Factura: factura.nombre_socio,
      Fecha_factura: factura.fecha_factura,
      Fecha_Vencimiento: factura.fecha_vencimiento ? new Date(factura.fecha_vencimiento).toLocaleDateString() : 'N/A',
      'Fecha Reprogramación': factura.fecha_reprogramacion ? new Date(factura.fecha_reprogramacion).toLocaleDateString() : 'N/A',
      Total: factura.total_en_divisa,
      Adeudado: factura.importe_adeudado_sin_signo,
      Estado: factura.estado,
      Empresa: factura.empresa
    })));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Notificaciones');
    XLSX.writeFile(wb, 'Notificaciones_Facturas.xlsx');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }

  formatDate(date: string): string {
    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString('es-CO');
  }
}

