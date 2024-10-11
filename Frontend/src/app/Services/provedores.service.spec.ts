import { TestBed } from '@angular/core/testing';

import { ProvedoresService } from './provedores.service';

describe('ProvedoresService', () => {
  let service: ProvedoresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProvedoresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
