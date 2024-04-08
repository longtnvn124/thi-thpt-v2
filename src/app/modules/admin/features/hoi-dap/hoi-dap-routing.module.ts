import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {QuanLyHoiDapComponent} from "@modules/admin/features/hoi-dap/quan-ly-hoi-dap/quan-ly-hoi-dap.component";

const routes: Routes = [
  {
    path:'',
    component:QuanLyHoiDapComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HoiDapRoutingModule { }
