import { Component, OnInit } from '@angular/core';

import {FormType, OvicForm } from '@modules/shared/models/ovic-models';
import {ThiSinhInfo} from "@shared/models/thi-sinh";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {debounceTime, Observable, Subject, Subscription} from "rxjs";
import { DiaDanh } from '@modules/shared/models/location';
import { AuthService } from '@core/services/auth.service';
import {NotificationService} from "@core/services/notification.service";
import {LocationService} from "@shared/services/location.service";
import {DDMMYYYYDateFormatValidator, NumberLessThanTenValidator, PhoneNumberValidator} from "@core/utils/validators";
import {ThisinhInfoService} from "@shared/services/thisinh-info.service";
import {BUTTON_NO, BUTTON_YES} from "@core/models/buttons";
interface FormThisinh extends OvicForm {
  object: ThiSinhInfo;
}
@Component({
  selector: 'app-thong-tin-thi-sinh',
  templateUrl: './thong-tin-thi-sinh.component.html',
  styleUrls: ['./thong-tin-thi-sinh.component.css']
})
export class ThongTinThiSinhComponent implements OnInit {
  formSave:FormGroup;

  userInfo: ThiSinhInfo;
  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormThisinh>();
  subscription = new Subscription();
  formActive: FormThisinh;
  titleBtn:'Lưu thông tin' | 'Cập nhật thông tin' = 'Lưu thông tin';
  sex:{name:string,code: string}[]=
    [
      {name:'Nữ',code:'nu'},
      {name:'Nam',code:'nam'}
    ];

  provinceOptions : DiaDanh[] = [];

  listForm = {
    [FormType.ADDITION]: {type: FormType.ADDITION, title: 'Thêm mới Thông tin cá nhân ', object: null, data: null},
    [FormType.UPDATE]: {type: FormType.UPDATE, title: 'Cập nhật Thông tin cá nhân ', object: null, data: null}
  };

  khuvucdata = [
    {title:'Khu vực 1',code :'KV1'},
    {title:'Khu vực 2',code :'KV2'},
    {title:'Khu vực 2 nông thôn',code :'KV1-NT'},
    {title:'Khu vực 3',code :'KV3'}
  ]
  constructor(
    private fb :FormBuilder,
    private auth: AuthService,
    private thisinhInfoService : ThisinhInfoService,
    private notifi :NotificationService,
    private locationService : LocationService ,

  ) {
    const observeProcessFormData = this.OBSERVE_PROCESS_FORM_DATA.asObservable().pipe(debounceTime(100)).subscribe(form => this.__processFrom(form));
    this.subscription.add(observeProcessFormData);

    this.formSave = this.fb.group({
      user_id:[this.auth.user.id,Validators.required],
      ten:[''],
      hoten:['',Validators.required],
      ngaysinh:['',[Validators.required, DDMMYYYYDateFormatValidator]],
      gioitinh:['',Validators.required],
      noisinh:['',Validators.required],
      noisinhkhac:[''],
      quequan:[{},Validators.required],
      phone:['',[Validators.required, PhoneNumberValidator, Validators.maxLength(12), Validators.minLength(6)]],
      anh_chandung:['',Validators.required],
      cccd_so:[null,Validators.required],
      cccd_ngaycap:['',Validators.required],
      cccd_noicap:['',Validators.required],
      cccd_img_truoc:[{},Validators.required],
      cccd_img_sau:[{},Validators.required],
      thuongtru_diachi:[{},Validators.required],
      nguoinhan_hoten:['',Validators.required],
      nguoinhan_phone:['',[Validators.required, PhoneNumberValidator, Validators.maxLength(12), Validators.minLength(6)]],
      nguoinhan_diachi:[{},Validators.required],
      khuvuc:[null,Validators.required],
      namtotnghiep_thpt:[null,Validators.required],
      lop10_thanhpho:[null,Validators.required],
      lop11_thanhpho:[null,Validators.required],
      lop12_thanhpho:[null,Validators.required],
      lop10_truong:[0,Validators.required],
      lop11_truong:[0,Validators.required],
      lop12_truong:[0,Validators.required],
      diem10ky1:[0,[Validators.required, NumberLessThanTenValidator]],
      diem10ky2:[0,[Validators.required, NumberLessThanTenValidator]],
      diem11ky1:[0,[Validators.required, NumberLessThanTenValidator]],
      diem11ky2:[0,[Validators.required, NumberLessThanTenValidator]],
      diem12ky1:[0,[Validators.required, NumberLessThanTenValidator]],
      diem12ky2:[0,[Validators.required, NumberLessThanTenValidator]],
      status:[0]
    });

  }
  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }
  ngOnInit(): void {
    this.loadInit();
  }
  loadInit(){
    this.getDataCitis();
    this._getDataUserInfo(this.auth.user.id);
  }
  getDataCitis(){
    this.locationService.listProvinces().subscribe({
      next:(data)=>{
        this.provinceOptions =data;
      }
    })
  }
  _getDataUserInfo(user_id: number){
    this.notifi.isProcessing(true);
    this.thisinhInfoService.getUserInfo(user_id).subscribe({
      next:data=>{
        if(data && this.provinceOptions){
          this.titleBtn = "Cập nhật thông tin";
          this.formActive = this.listForm[FormType.UPDATE];
          this.formActive.object = data;
          this.formSave.reset({
            user_id:this.auth.user.id,
            ten:data.ten,
            hoten:data.hoten,
            ngaysinh:data.ngaysinh,
            gioitinh:data.gioitinh,
            noisinh:data.noisinh,
            noisinhkhac:data.noisinhkhac,
            quequan:data.quequan,
            phone:data.phone,
            anh_chandung:data.anh_chandung,
            cccd_so:data.cccd_so,
            cccd_ngaycap:data.cccd_ngaycap,
            cccd_noicap:data.cccd_noicap,
            cccd_img_truoc:data.cccd_img_truoc,
            cccd_img_sau:data.cccd_img_sau,
            thuongtru_diachi:data.thuongtru_diachi,
            nguoinhan_hoten:data.nguoinhan_hoten,
            nguoinhan_phone:data.nguoinhan_phone,
            nguoinhan_diachi:data.nguoinhan_diachi,
            khuvuc:data.khuvuc,
            namtotnghiep_thpt:data.namtotnghiep_thpt,
            lop10_thanhpho:data.lop10_thanhpho,
            lop11_thanhpho:data.lop11_thanhpho,
            lop12_thanhpho:data.lop12_thanhpho,
            lop10_truong:data.lop11_truong,
            lop11_truong:data.lop11_truong,
            lop12_truong:data.lop12_truong,
            diem10ky1:data.diem10ky1,
            diem10ky2:data.diem10ky2,
            diem11ky1:data.diem11ky1,
            diem11ky2:data.diem11ky2,
            diem12ky1:data.diem12ky1,
            diem12ky2:data.diem12ky2,
            status:data.status,
          });
          this.userInfo = data;
        }else{
          this.formActive = this.listForm[FormType.ADDITION];
          this.titleBtn = "Lưu thông tin";
        }
        this.notifi.isProcessing(false);
      },error: (e)=>{
        this.notifi.isProcessing(false);
      }
    });

  }
  private __processFrom({data, object, type}: FormThisinh) {
    this.notifi.isProcessing(true);
    const observer$: Observable<any> = type === FormType.ADDITION ? this.thisinhInfoService.create(data) : this.thisinhInfoService.update(object.id, data);
    observer$.subscribe({
      next: () => {
        if(type === FormType.ADDITION){
          this.formActive = this.listForm[FormType.UPDATE];
        }
        this._getDataUserInfo(this.auth.user.id);
        this.notifi.isProcessing(false);
        this.notifi.toastSuccess('Thao tác thành công', 'Thông báo');
      },
      error: () => {
        this.notifi.isProcessing(false);
        this.notifi.toastError('Thao tác thất bại', 'Thông báo')
      }
    });
  }

  saveForm(){
    this.f['ten'].setValue(this.f['hoten'].value.split(' ').pop());
    this.f['hoten'].setValue(this.f['hoten'].value?.toString().trim());
    this.f['nguoinhan_hoten'].setValue(this.f['nguoinhan_hoten'].value?.toString().trim());
    if(this.formSave.valid){
      this.formActive.data = this.formSave.value;
      this.OBSERVE_PROCESS_FORM_DATA.next(this.formActive);
    }else{

      this.formSave.markAllAsTouched();
      this.notifi.toastError('Vui lòng nhập đủ thông tin');
    }
  }

  async privateData(){
    const button = await this.notifi.confirmRounded('<p class="text-danger">Xác nhận</p>','Khoá thông tin',[BUTTON_NO,BUTTON_YES]);
    if(button.name === BUTTON_YES.name){
      this.notifi.isProcessing(true);
      this.thisinhInfoService.update(this.userInfo.id , {status:1}).subscribe({
          next:()=>{
            this.notifi.toastSuccess('Khoá thông tin thành công');
            this.notifi.isProcessing(false);
            this._getDataUserInfo(this.auth.user.id);
          },error:(e)=>{
            this.notifi.toastError('Mất kết nối với máy chủ');
            this.notifi.isProcessing(false);
          }
        }
      )
    }
  }

  changeThuongchu(event){this.f['thuongtru_diachi'].setValue(event);}
  changeQuequan(event){this.f['quequan'].setValue(event);}
  changeNguoinhandc(event){this.f['nguoinhan_diachi'].setValue(event);}

}

