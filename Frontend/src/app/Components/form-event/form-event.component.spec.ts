import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormEventComponent } from './form-event.component';

describe('FormEventComponent', () => {
  let component: FormEventComponent;
  let fixture: ComponentFixture<FormEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormEventComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
