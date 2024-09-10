import { TestBed } from '@angular/core/testing';

import { FlujoService } from './flujo.service';

describe('FlujoService', () => {
  let service: FlujoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FlujoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
