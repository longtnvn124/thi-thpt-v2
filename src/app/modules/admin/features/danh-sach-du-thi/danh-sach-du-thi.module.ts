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


@NgModule({
    declarations: [
        ThiSinhDuThiComponent
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
    ]
})
export class DanhSachDuThiModule { }
