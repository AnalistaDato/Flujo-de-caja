import { TestBed } from '@angular/core/testing';

import { FacturasDateService } from './facturas-date.service';

describe('FacturasDateService', () => {
  let service: FacturasDateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacturasDateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
