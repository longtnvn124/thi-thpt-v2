import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HoiDapRoutingModule } from './hoi-dap-routing.module';
import { QuanLyHoiDapComponent } from './quan-ly-hoi-dap/quan-ly-hoi-dap.component';
import {ButtonModule} from "primeng/button";
import {DropdownModule} from "primeng/dropdown";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {InputTextModule} from "primeng/inputtext";
import {PaginatorModule} from "primeng/paginator";
import {RippleModule} from "primeng/ripple";
import {SharedModule} from "@shared/shared.module";


@NgModule({
  declarations: [
    QuanLyHoiDapComponent
  ],
  imports: [
    CommonModule,
    HoiDapRoutingModule,
    ButtonModule,
    DropdownModule,
    FormsModule,
    InputTextModule,
    PaginatorModule,
    ReactiveFormsModule,
    RippleModule,
    SharedModule
  ]
})
export class HoiDapModule { }
