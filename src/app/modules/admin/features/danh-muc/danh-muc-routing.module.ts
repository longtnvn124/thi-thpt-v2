import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ChuyenMucComponent} from "@modules/admin/features/danh-muc/chuyen-muc/chuyen-muc.component";
import {DiemDiTichComponent} from "@modules/admin/features/danh-muc/diem-di-tich/diem-di-tich.component";
import {LinhVucComponent} from "@modules/admin/features/danh-muc/linh-vuc/linh-vuc.component";
import {LoaiNguLieuComponent} from "@modules/admin/features/danh-muc/loai-ngu-lieu/loai-ngu-lieu.component";

import {ToHopMonComponent} from "@modules/admin/features/danh-muc/to-hop-mon/to-hop-mon.component";
import {DotThiComponent} from "@modules/admin/features/danh-muc/dot-thi/dot-thi.component";
import {MonComponent} from "@modules/admin/features/danh-muc/mon/mon.component";


const routes: Routes = [
  {
    path: 'mon',
    component: MonComponent,
    data: {state: 'danh-muc--mon'}
  },
  {
    path: 'to-hop-mon',
    component: ToHopMonComponent,
    data: {state: 'danh-muc--to-hop-mon'}
  },
  {
    path: 'dot-thi',
    component: DotThiComponent,
    data: {state: 'danh-muc--dot-thi'}
  },
  {
    path: 'chuyen-muc',
    component: ChuyenMucComponent,
    data: {state: 'danh-muc--chuyen-muc'}
  },
  {
    path: 'diem-di-tich',
    component: DiemDiTichComponent,
    data: {state: 'danh-muc--diem-di-tich'}
  },
  {
    path: 'linh-vuc',
    component: LinhVucComponent,
    data: {state: 'danh-muc--linh-vuc'}
  },
  {
    path: 'loai-ngu-lieu',
    component: LoaiNguLieuComponent,
    data: {state: 'danh-muc--loai-ngu-lieu'}
  },
  {
    path: '',
    redirectTo: 'mon',
    pathMatch: 'full'
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DanhMucRoutingModule {
}
