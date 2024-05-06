import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DanhSachDuThiRoutingModule } from './danh-sach-du-thi-routing.module';
import { ThiSinhDuThiComponent } from './thi-sinh-du-thi/thi-sinh-du-thi.component';
import { SharedModule } from "../../../shared/shared.module";
import { TableModule } from "primeng/table";
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { RippleModule } from "primeng/ripple";
import { TooltipModule } from "primeng/tooltip";
import { PaginatorModule } from 'primeng/paginator';
import { ThongTinThiSinhComponent } from './thi-sinh-du-thi/thong-tin-thi-sinh/thong-tin-thi-sinh.component';
import { ThiSinhDangKyThiComponent } from './thi-sinh-du-thi/thi-sinh-dang-ky-thi/thi-sinh-dang-ky-thi.component';
import {CheckboxModule} from "primeng/checkbox";
import {MatProgressBarModule} from "@angular/material/progress-bar";


@NgModule({
    declarations: [
        ThiSinhDuThiComponent,
        ThongTinThiSinhComponent,
        ThiSinhDangKyThiComponent
    ],
  imports: [
    CommonModule,
    DanhSachDuThiRoutingModule,
    SharedModule,
    TableModule,
    DropdownModule,
    InputTextModule,
    ButtonModule,
    RippleModule,
    TooltipModule,
    PaginatorModule,
    CheckboxModule,
    MatProgressBarModule,
  ]
})
export class DanhSachDuThiModule { }
