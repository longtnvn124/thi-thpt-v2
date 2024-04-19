import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {KetQuaThiComponent} from "@modules/admin/features/ket-qua/ket-qua-thi/ket-qua-thi.component";

const routes: Routes = [
  {
    path:'',
    component: KetQuaThiComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class KetQuaRoutingModule { }
