import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HoiDongThiComponent} from "@modules/admin/features/hoi-dong/hoi-dong-thi/hoi-dong-thi.component";

const routes: Routes = [
  {
    path:'',
    component: HoiDongThiComponent,

  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HoiDongRoutingModule { }
