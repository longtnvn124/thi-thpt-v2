import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KetQuaDanhKyComponent } from './ket-qua-danh-ky.component';

describe('KetQuaDanhKyComponent', () => {
  let component: KetQuaDanhKyComponent;
  let fixture: ComponentFixture<KetQuaDanhKyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KetQuaDanhKyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KetQuaDanhKyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
