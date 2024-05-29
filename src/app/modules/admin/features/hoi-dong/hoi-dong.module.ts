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
import { MultiSelectModule } from "primeng/multiselect";
import { TooltipModule } from "primeng/tooltip";
import { SplitterModule } from "primeng/splitter";
import { PaginatorModule } from "primeng/paginator";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { AddThiSinhComponent } from './hoi-dong-thi/add-thi-sinh/add-thi-sinh.component';
import {RadioButtonModule} from "primeng/radiobutton";
import {CheckboxModule} from "primeng/checkbox";
import {MatMenuModule} from "@angular/material/menu";
import {CalendarModule} from "primeng/calendar";
import { PhongThiV2Component } from './hoi-dong-thi/phong-thi-v2/phong-thi-v2.component';
import { PhongThiV3Component } from './hoi-dong-thi/phong-thi-v3/phong-thi-v3.component';
import { ThiSinhInHoiDongComponent } from './hoi-dong-thi/thi-sinh-in-hoi-dong/thi-sinh-in-hoi-dong.component';
@NgModule({
    declarations: [
        HoiDongThiComponent,
        PhongThiComponent,
        AddThiSinhComponent,
        PhongThiV2Component,
        PhongThiV3Component,
        ThiSinhInHoiDongComponent
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
        ReactiveFormsModule,
        MultiSelectModule,
        TooltipModule,
        SplitterModule,
        PaginatorModule,
        MatProgressBarModule,
        RadioButtonModule,
        CheckboxModule,
        MatMenuModule,
        CalendarModule,

    ]
})
export class HoiDongModule { }
