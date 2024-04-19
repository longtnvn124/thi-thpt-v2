import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddThiSinhComponent } from './add-thi-sinh.component';

describe('AddThiSinhComponent', () => {
  let component: AddThiSinhComponent;
  let fixture: ComponentFixture<AddThiSinhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddThiSinhComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddThiSinhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
