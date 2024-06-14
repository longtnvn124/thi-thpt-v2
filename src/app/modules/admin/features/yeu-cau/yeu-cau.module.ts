import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { YeuCauRoutingModule } from './yeu-cau-routing.module';
import { CapNhatThongTinThiSinhComponent } from './cap-nhat-thong-tin-thi-sinh/cap-nhat-thong-tin-thi-sinh.component';
import {InputSwitchModule} from "primeng/inputswitch";
import {InputTextModule} from "primeng/inputtext";
import {MatMenuModule} from "@angular/material/menu";
import {PaginatorModule} from "primeng/paginator";
import {SharedModule} from "primeng/api";
import {TableModule} from "primeng/table";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";


@NgModule({
  declarations: [
    CapNhatThongTinThiSinhComponent
  ],
  imports: [
    CommonModule,
    YeuCauRoutingModule,
    InputSwitchModule,
    InputTextModule,
    MatMenuModule,
    PaginatorModule,
    SharedModule,
    TableModule,
    ButtonModule,
    RippleModule
  ]
})
export class YeuCauModule { }
