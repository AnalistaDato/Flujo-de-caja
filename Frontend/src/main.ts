import { bootstrapApplication } from '@angular/platform-browser';
import { environment } from './environments/environment';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import 'zone.js'; // hack for StackBlitz

/// <reference types="@angular/localize" />

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

console.log('Entorno:', environment.production ? 'Producción' : 'Desarrollo');
console.log('API Base URL:', environment.apiBaseUrl);