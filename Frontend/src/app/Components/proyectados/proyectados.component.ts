import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProyectadosService, FacturaProyectada } from 'app/Services/proyectados.service';
import * as XLSX from 'xlsx';
import { Subject } from 'rxjs';
import { DataTablesModule } from 'angular-datatables';
import {
  ColComponent,
  GridModule,
  RowComponent
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import 'datatables.net-bs5';
import { Config } from 'datatables.net-bs5';
import { HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-proyectados',
  standalone: true,
  imports: [
    CommonModule,
    DataTablesModule,
    ColComponent,
    RowComponent,
    IconModule,
    GridModule
  ],
  templateUrl: './proyectados.component.html',
  styleUrls: ['./proyectados.component.css']
})
export class ProyectadosComponent implements OnInit, OnDestroy {

  dtOptions: Config = {};
  data: FacturaProyectada[] = [];
  dtTrigger: Subject<void> = new Subject();

  constructor(private proyectadosService: ProyectadosService) { }

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

        this.proyectadosService.getDatos(params).subscribe({
          next: (response: any) => {
            console.log("Datos recibidos desde el backend:", response);
            this.data = response.data || []; // Asegúrate de que 'data' esté presente

            callback({
              draw: dataTablesParams.draw,
              recordsTotal: response.recordsTotal,
              recordsFiltered: response.recordsFiltered,
              data: this.data
            });
          },
          error: (err) => console.error('Error en la solicitud AJAX:', err)
        });
      },
      columns: [
        { data: 'id' },
        { data: 'factura' },
        {
          data: 'fecha',
          render: (data: string) => this.formatDate(data) // Format date
        },
        {
          data: 'fecha_reprogramacion',
          render: (data: string) => this.formatDate(data) // Format date
        },
        { data: 'cuenta' },
        { data: 'detalle' },
        { data: 'comunicacion' },
        {
          data: 'debito',
          render: (data: number) => this.formatCurrency(data) // Format currency
        },
        {
          data: 'credito',
          render: (data: number) => this.formatCurrency(data) // Format currency
        },
        { data: 'socio' },
        { data: 'banco' },
        { data: 'estado' },
        { data: 'empresa' },
        {
          data: null,
          orderable: false,
          render: (data: any) => {
            return `
              <button type="button" class="btn btn-success btn-sm inactivate-btn" title="Reprogramar" data-id="${data.id}">
                <i class="cil-check"></i> 
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
      }
    };

    // Subscribirse a las proyecciones y activar el dtTrigger
    this.proyectadosService.proyecciones$.subscribe(() => {
      this.dtTrigger.next();
    });
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }

  formatDate(date: string): string {
    const formattedDate = new Date(date);
    return formattedDate.toLocaleDateString('es-CO');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }

  getRowDataId(event: any): number {
    const id = event.currentTarget.getAttribute('data-id');
    return parseInt(id, 10) || -1; // Default value if 'id' not found
  }

  exportToExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.data.map(factura => ({
      ID: factura.id,
      Factura: factura.factura,
      Fecha_factura: factura.fecha ? new Date(factura.fecha).toLocaleDateString() : 'N/A',
      Fecha_Vencimiento: factura.fecha ? new Date(factura.fecha).toLocaleDateString() : 'N/A',
      'Fecha Reprogramación': factura.fecha_reprogramacion ? new Date(factura.fecha_reprogramacion).toLocaleDateString() : 'N/A',
      Total: factura.debito,
      Adeudado: factura.credito,
      Estado: factura.estado,
      Empresa: factura.empresa
    })));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Facturas Proyectadas');
    XLSX.writeFile(wb, 'Facturas_Proyectadas.xlsx');
  }

  onInactivate(id: number): void {
    if (id !== -1) {
      const confirmed = window.confirm('¿Estás seguro de que deseas inactivar este registro? Esta acción no se puede deshacer.');

      if (confirmed) {
        this.proyectadosService.inactivateRecord(id).subscribe({
          next: (response) => {
            console.log('Factura inactivada con éxito:', response.message);
          },
          error: (error) => {
            console.error('Error al inactivar la factura:', error);
          }
        });
      }
    }
  }
}
