import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KetQuaRoutingModule } from './ket-qua-routing.module';
import { KetQuaThiComponent } from './ket-qua-thi/ket-qua-thi.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RippleModule} from "primeng/ripple";
import {ButtonModule} from "primeng/button";
import {TabViewModule} from "primeng/tabview";
import {CheckboxModule} from "primeng/checkbox";
import {DropdownModule} from "primeng/dropdown";
import {InputTextModule} from "primeng/inputtext";
import {MatMenuModule} from "@angular/material/menu";
import {PaginatorModule} from "primeng/paginator";
import {SharedModule} from "@shared/shared.module";
import {TableModule} from "primeng/table";
import {TooltipModule} from "primeng/tooltip";

@NgModule({
  declarations: [
    KetQuaThiComponent
  ],
  imports: [
    CommonModule,
    KetQuaRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    RippleModule,
    ButtonModule,
    TabViewModule,
    CheckboxModule,
    DropdownModule,
    InputTextModule,
    MatMenuModule,
    PaginatorModule,
    SharedModule,
    TableModule,
    TooltipModule,
  ]
})
export class KetQuaModule { }
