import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HoiDongRoutingModule } from './hoi-dong-routing.module';
import { HoiDongThiComponent } from './hoi-dong-thi/hoi-dong-thi.component';
import { ButtonModule } from "primeng/button";
import { DropdownModule } from "primeng/dropdown";
import { InputTextModule } from "primeng/inputtext";
import { RippleModule } from "primeng/ripple";
import { TableModule } from "primeng/table";
import { SharedModule } from "../../../shared/shared.module";
import { ReactiveFormsModule } from "@angular/forms";
import { PhongThiComponent } from './hoi-dong-thi/phong-thi/phong-thi.component';
@NgModule({
    declarations: [
        HoiDongThiComponent,
        PhongThiComponent
    ],
    imports: [
        CommonModule,
        HoiDongRoutingModule,
        DropdownModule,
        ButtonModule,
        InputTextModule,
        RippleModule,
        TableModule,
        SharedModule,
        ReactiveFormsModule
    ]
})
export class HoiDongModule { }
