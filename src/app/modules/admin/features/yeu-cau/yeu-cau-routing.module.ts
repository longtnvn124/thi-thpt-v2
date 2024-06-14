import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  CapNhatThongTinThiSinhComponent
} from "@modules/admin/features/yeu-cau/cap-nhat-thong-tin-thi-sinh/cap-nhat-thong-tin-thi-sinh.component";

const routes: Routes = [
  {
    path:'cap-nhat-thong-tin',
    component:CapNhatThongTinThiSinhComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class YeuCauRoutingModule { }
