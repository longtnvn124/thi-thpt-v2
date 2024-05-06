import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ThiSinhRoutingModule } from './thi-sinh-routing.module';
import { ThiSinhDangKyComponent } from './thi-sinh-dang-ky/thi-sinh-dang-ky.component';
import { ThongTinThiSinhComponent } from './thong-tin-thi-sinh/thong-tin-thi-sinh.component';
import {SharedModule} from "@shared/shared.module";
import {ReactiveFormsModule} from "@angular/forms";
import {DropdownModule} from "primeng/dropdown";
import {InputMaskModule} from "primeng/inputmask";
import {RippleModule} from "primeng/ripple";
import {ButtonModule} from "primeng/button";
import {MultiSelectModule} from "primeng/multiselect";
import {TableModule} from "primeng/table";
import {InputTextModule} from "primeng/inputtext";
import {PaginatorModule} from "primeng/paginator";
import { TraCuuKetQuaComponent } from './tra-cuu-ket-qua/tra-cuu-ket-qua.component';
import {CheckboxModule} from "primeng/checkbox";
import {TooltipModule} from "primeng/tooltip";
import {DialogModule} from "primeng/dialog";
import {TabViewModule} from "primeng/tabview";


@NgModule({
  declarations: [
    ThiSinhDangKyComponent,
    ThongTinThiSinhComponent,
    TraCuuKetQuaComponent
  ],
  imports: [
    CommonModule,
    ThiSinhRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    DropdownModule,
    InputMaskModule,
    RippleModule,
    ButtonModule,
    MultiSelectModule,
    TableModule,
    InputTextModule,
    PaginatorModule,
    CheckboxModule,
    TooltipModule,
    DialogModule,
    TabViewModule
  ]
})
export class ThiSinhModule { }
