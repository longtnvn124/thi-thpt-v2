import { NgModule } from '@angular/core';
import { RouterModule , Routes } from '@angular/router';
import { ContentNoneComponent } from '@modules/admin/features/content-none/content-none.component';
import { DashboardComponent } from '@modules/admin/dashboard/dashboard.component';
import { AdminGuard } from '@core/guards/admin.guard';
import {HomeComponent} from "@modules/admin/features/home/home.component";
import {KeHoachThiComponent} from "@modules/admin/features/ke-hoach-thi/ke-hoach-thi.component";

const routes : Routes = [
	{
		path             : '' ,
		component        : DashboardComponent ,
		canActivateChild : [ AdminGuard ] ,
		children         : [
			{
				path       : '' ,
				redirectTo : 'thi-sinh' ,
				pathMatch  : 'prefix'
			} ,
			{
				path      : 'dashboard' ,
				component : HomeComponent ,
				data      : { state : 'dashboard' }
			} ,


			{
				path      : 'content-none' ,
				component : ContentNoneComponent ,
				data      : { state : 'content-none' }
			} ,
			{
				path         : 'he-thong' ,
				loadChildren : () => import('@modules/admin/features/he-thong/he-thong.module').then( m => m.HeThongModule )
			} ,
			{
				path         : 'danh-muc' ,
				loadChildren : () => import('@modules/admin/features/danh-muc/danh-muc.module').then( m => m.DanhMucModule )
			} ,
      {
        path         : 'ke-hoach-thi' ,
        component:KeHoachThiComponent,
        data      : { state : 'ke-hoach-thi' }
      } ,
      {
        path         : 'dangky-thi' ,
        loadChildren : () => import('@modules/admin/features/danh-sach-du-thi/danh-sach-du-thi.module').then( m => m.DanhSachDuThiModule )
      } ,
      {
        path         : 'ketqua-thi' ,
        loadChildren : () => import('@modules/admin/features/ket-qua/ket-qua.module').then( m => m.KetQuaModule )
      } ,
      {
        path         : 'hoidong-thi' ,
        loadChildren : () => import('@modules/admin/features/hoi-dong/hoi-dong.module').then( m => m.HoiDongModule )
      } ,
      {
        path         : 'hoi-dap' ,
        loadChildren : () => import('@modules/admin/features/hoi-dap/hoi-dap.module').then( m => m.HoiDapModule )
      } ,
      {
        path         : 'thi-sinh' ,
        loadChildren : () => import('@modules/admin/features/thi-sinh/thi-sinh.module').then( m => m.ThiSinhModule )
      } ,
      {
        path         : 'quan-ly-thi-sinh' ,
        loadChildren : () => import('@modules/admin/features/danh-sach-thi-sinh/danh-sach-thi-sinh.module').then( m => m.DanhSachThiSinhModule )
      } ,
      {
        path         : 'tra-ket-qua-thi' ,
        loadChildren : () => import('@modules/admin/features/tra-ket-qua-thi/tra-ket-qua-thi.module').then( m => m.TraKetQuaThiModule )
      } ,
			{
				path         : 'message' ,
				loadChildren : () => import('@modules/admin/features/ovic-message/ovic-message.module').then( m => m.OvicMessageModule )
			} ,
			{
				path       : '**' ,
				redirectTo : '/admin/thi-sinh' ,
				pathMatch  : 'prefix'
			}
		]
	}
];

@NgModule( {
	imports : [ RouterModule.forChild( routes ) ] ,
	exports : [ RouterModule ]
} )
export class AdminRoutingModule {}
