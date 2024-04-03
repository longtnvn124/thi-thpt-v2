import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ThiSinhRoutingModule } from './thi-sinh-routing.module';
import { KetQuaDanhKyComponent } from './ket-qua-danh-ky/ket-qua-danh-ky.component';
import { ThiSinhDangKyComponent } from './thi-sinh-dang-ky/thi-sinh-dang-ky.component';
import { ThongTinThiSinhComponent } from './thong-tin-thi-sinh/thong-tin-thi-sinh.component';
import {SharedModule} from "@shared/shared.module";
import {ReactiveFormsModule} from "@angular/forms";
import {DropdownModule} from "primeng/dropdown";
import {InputMaskModule} from "primeng/inputmask";
import {RippleModule} from "primeng/ripple";
import {ButtonModule} from "primeng/button";


@NgModule({
  declarations: [
    KetQuaDanhKyComponent,
    ThiSinhDangKyComponent,
    ThongTinThiSinhComponent
  ],
  imports: [
    CommonModule,
    ThiSinhRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    DropdownModule,
    InputMaskModule,
    RippleModule,
    ButtonModule
  ]
})
export class ThiSinhModule { }
