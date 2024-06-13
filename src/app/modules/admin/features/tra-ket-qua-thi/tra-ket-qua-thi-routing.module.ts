import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {TraKetQuaComponent} from "@modules/admin/features/tra-ket-qua-thi/tra-ket-qua/tra-ket-qua.component";

const routes: Routes = [
  {
    path:'',
    component:TraKetQuaComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TraKetQuaThiRoutingModule { }
