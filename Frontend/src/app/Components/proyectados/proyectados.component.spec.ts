import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProyectadosComponent } from './proyectados.component';

describe('ProyectadosComponent', () => {
  let component: ProyectadosComponent;
  let fixture: ComponentFixture<ProyectadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProyectadosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProyectadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
