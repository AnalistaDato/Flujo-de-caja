import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import 'zone.js'; // hack for StackBlitz
/// <reference types="@angular/localize" />

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
