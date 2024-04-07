import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoiDongThiComponent } from './hoi-dong-thi.component';

describe('HoiDongThiComponent', () => {
  let component: HoiDongThiComponent;
  let fixture: ComponentFixture<HoiDongThiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HoiDongThiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HoiDongThiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
