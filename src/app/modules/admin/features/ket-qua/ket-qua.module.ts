import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KetQuaRoutingModule } from './ket-qua-routing.module';
import { KetQuaThiComponent } from './ket-qua-thi/ket-qua-thi.component';


@NgModule({
  declarations: [
    KetQuaThiComponent
  ],
  imports: [
    CommonModule,
    KetQuaRoutingModule
  ]
})
export class KetQuaModule { }
