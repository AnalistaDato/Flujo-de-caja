import { TestBed } from '@angular/core/testing';

import { ProyectadosService } from './proyectados.service';

describe('ProyectadosService', () => {
  let service: ProyectadosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProyectadosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
