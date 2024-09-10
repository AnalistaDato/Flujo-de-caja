import { TestBed } from '@angular/core/testing';

import { ExtractoService } from './extracto.service';

describe('ExtractoService', () => {
  let service: ExtractoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExtractoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
