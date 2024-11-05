import { TestBed } from '@angular/core/testing';

import { FactrurasService } from './factruras.service';

describe('FactrurasService', () => {
  let service: FactrurasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FactrurasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
