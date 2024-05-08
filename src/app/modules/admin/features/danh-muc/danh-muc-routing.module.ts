import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ToHopMonComponent} from "@modules/admin/features/danh-muc/to-hop-mon/to-hop-mon.component";
import {DotThiComponent} from "@modules/admin/features/danh-muc/dot-thi/dot-thi.component";
import {MonComponent} from "@modules/admin/features/danh-muc/mon/mon.component";
import {TruongHocComponent} from "@modules/admin/features/danh-muc/truong-hoc/truong-hoc.component";
import {LePhiThiComponent} from "@modules/admin/features/danh-muc/le-phi-thi/le-phi-thi.component";
import {
  KhaiBaoPhongThiComponent
} from "@modules/admin/features/danh-muc/khai-bao-phong-thi/khai-bao-phong-thi.component";
import {DoiTuongUuTienComponent} from "@modules/admin/features/danh-muc/doi-tuong-uu-tien/doi-tuong-uu-tien.component";


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
    path: 'truong-hoc',
    component: TruongHocComponent,
    data: {state: 'danh-muc--truong-hoc'}
  },
  {
    path: 'doi-tuong',
    component: DoiTuongUuTienComponent,
    data: {state: 'danh-muc--doi-tuong'}
  },
  {
    path: 'le-phi-thi',
    component: LePhiThiComponent,
    data: {state: 'danh-muc--le-phi-thi'}
  },
  {
    path: 'phong-thi',
    component: KhaiBaoPhongThiComponent,
    data: {state: 'danh-muc--phong-thi'}
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
