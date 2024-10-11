import { TestBed } from '@angular/core/testing';

import { CuentasContablesService } from './cuentas-contables.service';

describe('CuentasContablesService', () => {
  let service: CuentasContablesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CuentasContablesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
