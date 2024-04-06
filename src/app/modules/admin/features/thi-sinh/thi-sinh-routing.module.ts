import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  ThongTinThiSinhComponent
} from "@modules/admin/features/thi-sinh/thong-tin-thi-sinh/thong-tin-thi-sinh.component";
import {ThiSinhDangKyComponent} from "@modules/admin/features/thi-sinh/thi-sinh-dang-ky/thi-sinh-dang-ky.component";
import {TraCuuKetQuaComponent} from "@modules/admin/features/thi-sinh/tra-cuu-ket-qua/tra-cuu-ket-qua.component";

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
    path:'ket-qua',
    component:TraCuuKetQuaComponent,
    data: {state: 'thisinh--ket-qua'}
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
