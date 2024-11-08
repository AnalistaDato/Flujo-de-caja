import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormConsolidacionComponent } from './form-consolidacion.component';

describe('FormConsolidacionComponent', () => {
  let component: FormConsolidacionComponent;
  let fixture: ComponentFixture<FormConsolidacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormConsolidacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormConsolidacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
