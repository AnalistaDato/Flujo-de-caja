import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlujoService } from '../../Services/flujo.service';
import { DaySummary } from '../../Services/flujo.service';



@Component({
  selector: 'app-flujo-de-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flujo-de-caja.component.html',
  styleUrls: ['./flujo-de-caja.component.css']
})
export class FlujoDeCajaComponent implements OnInit {

  daySummaries: DaySummary[] = [];
  selectedYear!: number;
  selectedMonth!: number;
  


  constructor(private flujoService: FlujoService) { }

  ngOnInit(): void {
    this.selectedYear = new Date().getFullYear();
    this.selectedMonth = new Date().getMonth() + 1;
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.flujoService.getDaySummaries(this.selectedMonth, this.selectedYear)
      .subscribe(summaries => {
        this.daySummaries = summaries;
      });
  }

  onMonthChange(): void {
    this.cargarDatos();
  }

}
