import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DaySummary } from '../../Services/flujo.service';



@Component({
  selector: 'app-flujo-de-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flujo-de-caja.component.html',
  styleUrls: ['./flujo-de-caja.component.css']
})
export class FlujoDeCajaComponent  {

  daySummaries: DaySummary[] = [];
  selectedYear!: number;
  selectedMonth!: number;
  


  constructor() { }

}