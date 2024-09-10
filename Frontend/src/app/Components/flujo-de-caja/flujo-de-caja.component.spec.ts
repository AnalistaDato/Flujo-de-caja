import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlujoDeCajaComponent } from './flujo-de-caja.component';

describe('FlujoDeCajaComponent', () => {
  let component: FlujoDeCajaComponent;
  let fixture: ComponentFixture<FlujoDeCajaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlujoDeCajaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlujoDeCajaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
