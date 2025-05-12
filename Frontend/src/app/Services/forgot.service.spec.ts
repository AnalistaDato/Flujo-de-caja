import { TestBed } from '@angular/core/testing';

import { ForgotService } from './forgot.service';

describe('ForgotService', () => {
  let service: ForgotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ForgotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
