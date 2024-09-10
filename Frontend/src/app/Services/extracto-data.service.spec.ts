import { TestBed } from '@angular/core/testing';

import { ExtractoDataService } from './extracto-data.service';

describe('ExtractoDataService', () => {
  let service: ExtractoDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExtractoDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
