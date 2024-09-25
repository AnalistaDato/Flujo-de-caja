import { TestBed } from '@angular/core/testing';

import { ConsolidadoService } from './consolidado.service';

describe('ConsolidadoService', () => {
  let service: ConsolidadoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsolidadoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
