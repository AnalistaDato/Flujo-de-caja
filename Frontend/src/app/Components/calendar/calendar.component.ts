import { Component, signal, ChangeDetectorRef, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { EventService } from '../../Services/event.service';
import { CommonModule } from '@angular/common';
import esLocale from '@fullcalendar/core/locales/es';
import { FormEventComponent } from '../form-event/form-event.component';
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
  RowComponent,
  ThemeDirective, ModalBodyComponent, ModalComponent, ModalTitleDirective, ModalFooterComponent, ModalHeaderComponent,
} from '@coreui/angular';
import { TablesComponent } from '../tables/tables.component';
import { DataService } from '../../Services/data.service';
import { CuentasContablesService } from '../../Services/cuentas-contables.service';
import { FormConsolidacionComponent } from "../form-consolidacion/form-consolidacion.component";



@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [ButtonGroupComponent, AlertComponent,
    ColComponent,
    ContainerComponent,
    FormCheckComponent,
    FormCheckInputDirective,
    FormControlDirective,
    FormDirective,
    FormSelectDirective,
    GridModule,
    InputGroupComponent,
    RowComponent,
    ThemeDirective, ButtonCloseDirective, ButtonDirective, ModalBodyComponent, ModalTitleDirective, ModalFooterComponent, ModalHeaderComponent, ModalComponent, FormEventComponent, CommonModule, RouterOutlet, FullCalendarModule, FormConsolidacionComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {

  selectedEvent: any;
  addRecordModalVisible: boolean = false;
  uploadModalVisible: boolean = false;
  public selectedFile: File | null = null;
  public uploadMessage: string = '';
  public showAlert: boolean = false;
  selectedDate: { start: string; end: string; allDay: boolean } | null = null; // Declare selectedDate


  calendarVisible = signal(true);
  calendarOptions = signal<CalendarOptions>({
    plugins: [
      interactionPlugin,
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
    ],
    locale: esLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    initialView: 'dayGridMonth',
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this), // Use EventApi[]
    events: [] // Initial empty array
  });
  currentEvents = signal<EventApi[]>([]);

  constructor(private changeDetector: ChangeDetectorRef, private eventService: EventService) { }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents() {
    this.eventService.getEvents().subscribe((events) => {
      // Transform the events to match the EventInput format
      this.calendarOptions.update((options) => ({
        ...options,
        events: events.map(event => ({
          ...event,
          extendedProps: {
            ...event.extendedProps,
            description: this.formatCurrency(event.extendedProps?.["description"])
          }
        }))
      }));
    });
  }

  handleCalendarToggle() {
    this.calendarVisible.update((bool) => !bool);
  }

  handleWeekendsToggle() {
    this.calendarOptions.update((options) => ({
      ...options,
      weekends: !options.weekends,
    }));
  }

 
  

  handleDateSelect(selectInfo: DateSelectArg) {

    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect(); // clear date selection

    this.openAddRecordModal();
  }

  handleEventClick(clickInfo: EventClickArg) {
    if (confirm(`¿Esta seguro de eliminar este registro?'${clickInfo.event.title}'`)) {
      clickInfo.event.remove();
    }
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents.set(events);
    this.changeDetector.detectChanges();// Workaround for change detection issue
  }


  formatCurrency(value: string | number): string {
    const numberValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(numberValue);
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



}
