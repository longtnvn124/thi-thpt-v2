import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TraKetQuaThiRoutingModule } from './tra-ket-qua-thi-routing.module';
import { TraKetQuaComponent } from './tra-ket-qua/tra-ket-qua.component';


@NgModule({
  declarations: [
    TraKetQuaComponent
  ],
  imports: [
    CommonModule,
    TraKetQuaThiRoutingModule
  ]
})
export class TraKetQuaThiModule { }
