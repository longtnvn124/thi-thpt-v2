import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KetQuaThiComponent } from './ket-qua-thi.component';

describe('KetQuaThiComponent', () => {
  let component: KetQuaThiComponent;
  let fixture: ComponentFixture<KetQuaThiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KetQuaThiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KetQuaThiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
