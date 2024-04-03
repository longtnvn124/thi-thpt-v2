import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  ThongTinThiSinhComponent
} from "@modules/admin/features/thi-sinh/thong-tin-thi-sinh/thong-tin-thi-sinh.component";
import {ThiSinhDangKyComponent} from "@modules/admin/features/thi-sinh/thi-sinh-dang-ky/thi-sinh-dang-ky.component";
import {KetQuaDanhKyComponent} from "@modules/admin/features/thi-sinh/ket-qua-danh-ky/ket-qua-danh-ky.component";

const routes: Routes = [
  {
    path:'thong-tin',
    component:ThongTinThiSinhComponent,
    data: {state: 'thisinh--thong-tin'}
  },
  {
    path:'dang-ky',
    component:ThiSinhDangKyComponent,
    data: {state: 'thisinh--dang-ky'}
  },
  {
    path:'ket-qua-dang-ky',
    component:KetQuaDanhKyComponent,
    data: {state: 'thisinh--ket-qua-dang-ky'}
  },
  {
    path: '',
    redirectTo: 'thong-tin',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ThiSinhRoutingModule { }
