import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HoiDongRoutingModule } from './hoi-dong-routing.module';
import { HoiDongThiComponent } from './hoi-dong-thi/hoi-dong-thi.component';


@NgModule({
  declarations: [
    HoiDongThiComponent
  ],
  imports: [
    CommonModule,
    HoiDongRoutingModule
  ]
})
export class HoiDongModule { }
