import { TestBed } from '@angular/core/testing';

import { MasivoService } from './masivo.service';

describe('MasivoService', () => {
  let service: MasivoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MasivoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
