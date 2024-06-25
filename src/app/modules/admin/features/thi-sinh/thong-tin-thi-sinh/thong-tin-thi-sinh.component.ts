import {Component, OnInit} from '@angular/core';

import {FormType, OvicForm} from '@modules/shared/models/ovic-models';
import {ThiSinhInfo} from "@shared/models/thi-sinh";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from "@angular/forms";
import {debounceTime, forkJoin, Subject, Subscription} from "rxjs";
import {DiaDanh} from '@modules/shared/models/location';
import {AuthService} from '@core/services/auth.service';
import {NotificationService} from "@core/services/notification.service";
import {LocationService} from "@shared/services/location.service";
import {DDMMYYYYDateFormatValidator, NumberLessThanTenValidator, PhoneNumberValidator} from "@core/utils/validators";
import {ThisinhInfoService} from "@shared/services/thisinh-info.service";
import {BUTTON_CANCEL, BUTTON_NO, BUTTON_YES} from "@core/models/buttons";
import {DanToc, DEPARTMENT_OF_EDUCATION, SCHOOL_BY_DEPARTMENT, SchoolDepartment} from "@shared/utils/syscat";
import {DanhMucDoiTuong, DanhMucDoituongUutienService} from "@shared/services/danh-muc-doituong-uutien.service";
import {DmTruongHoc} from "@shared/models/danh-muc";
import {DanhMucTruongHocService} from "@shared/services/danh-muc-truong-hoc.service";


interface FormThisinh extends OvicForm {
  object: ThiSinhInfo;
}

export function replaceCommaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value == null) {
      return null;
    }
    const value = control.value.toString();
    const newValue = value.replace(/,/g, '.');
    if (newValue !== value) {
      control.setValue(newValue, {emitEvent: false}); // Update value without emitting event
    }
    return null; // Always return null since we're just replacing characters
  };
}

@Component({
  selector: 'app-thong-tin-thi-sinh',
  templateUrl: './thong-tin-thi-sinh.component.html',
  styleUrls: ['./thong-tin-thi-sinh.component.css']
})
export class ThongTinThiSinhComponent implements OnInit {

  departmentData = DEPARTMENT_OF_EDUCATION;
  schoolByDepartment = SCHOOL_BY_DEPARTMENT;

  dataSogiaoduc:DmTruongHoc[];
  datatruong10:DmTruongHoc[];
  datatruong11:DmTruongHoc[];
  datatruong12:DmTruongHoc[];
  checkdata: 1 | 0 = 0;// o :load data
  formSave: FormGroup;

  userInfo: ThiSinhInfo;
  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormThisinh>();
  subscription = new Subscription();
  formActive: FormThisinh;
  titleBtn: 'Lưu thông tin' | 'Cập nhật thông tin' = 'Lưu thông tin';
  sex: { name: string, code: string }[] =
    [
      {name: 'Nữ', code: 'nu'},
      {name: 'Nam', code: 'nam'}
    ];
  dantoc = DanToc;
  provinceOptions: DiaDanh[] = [];

  listForm = {
    [FormType.ADDITION]: {type: FormType.ADDITION, title: 'Thêm mới Thông tin cá nhân ', object: null, data: null},
    [FormType.UPDATE]: {type: FormType.UPDATE, title: 'Cập nhật Thông tin cá nhân ', object: null, data: null}
  };

  khuvucdata = [
    {title: 'Khu vực 1', code: 'KV1'},
    {title: 'Khu vực 2', code: 'KV2'},
    {title: 'Khu vực 2 nông thôn', code: 'KV2-NT'},
    {title: 'Khu vực 3', code: 'KV3'}
  ]

  chuongtrinhhoc: { id: number, value: string, label: string }[] = [
    {id: 1, label: 'Thí sinh học chương trình THPT ', value: 'THPT'},
    {id: 2, label: 'Thí sinh học chương trình GDTX ', value: 'GDTX'},
  ]
  trangthaitotnghiep: { id: number, value: number, label: string }[] = [
    {id: 1, label: 'Thí sinh tự do chưa tốt nghiệp THPT  ', value: 1},
    {id: 2, label: 'Thí sinh tự do đã tốt nghiệp THPT ', value: 0},
  ]
  danhMucDoiTuong: DanhMucDoiTuong[];

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private thisinhInfoService: ThisinhInfoService,
    private notifi: NotificationService,
    private locationService: LocationService,
    private danhMucDoituongUutienService: DanhMucDoituongUutienService,
    private danhMucTruongHocService: DanhMucTruongHocService
  ) {
    const observeProcessFormData = this.OBSERVE_PROCESS_FORM_DATA.asObservable().pipe(debounceTime(100)).subscribe(form => this.__processFrom(form));
    this.subscription.add(observeProcessFormData);

    this.formSave = this.fb.group({
      user_id: [this.auth.user.id, Validators.required],
      ten: [''],
      hoten: [this.auth.user.display_name, Validators.required],
      ngaysinh: ['', [Validators.required, DDMMYYYYDateFormatValidator]],
      dantoc: ['', Validators.required],
      tongiao: [''],
      gioitinh: ['', Validators.required],
      noisinh: ['', Validators.required],
      phone: [this.auth.user.phone, [Validators.required, PhoneNumberValidator, Validators.minLength(6)]],
      anh_chandung: [null, Validators.required],
      cccd_so: [this.auth.user.username, [Validators.required, PhoneNumberValidator]],
      cccd_ngaycap: ['', [Validators.required, DDMMYYYYDateFormatValidator]],
      cccd_noicap: ['Cục quản lý hành chính về TTXH', Validators.required],
      cccd_img_truoc: [null, Validators.required],
      cccd_img_sau: [null, Validators.required],
      thuongtru_diachi: [{}, Validators.required],
      nguoinhan_hoten: ['', Validators.required],
      nguoinhan_phone: ['', [Validators.required, PhoneNumberValidator, Validators.maxLength(12), Validators.minLength(6)]],
      nguoinhan_diachi: [null, Validators.required],
      khuvuc: [null, Validators.required],
      namtotnghiep_thpt: [null, [Validators.required,PhoneNumberValidator]],
      lop10_thanhpho: [null],
      lop11_thanhpho: [null],
      lop12_thanhpho: [null],
      lop10_department: [null],
      lop11_department: [null],
      lop12_department: [null],
      lop10_truong: [''],
      lop11_truong: [''],
      lop12_truong: [''],
      diem10ky1: [null, [NumberLessThanTenValidator, replaceCommaValidator()]],
      diem10ky2: [null, [NumberLessThanTenValidator, replaceCommaValidator()]],
      diem11ky1: [null, [NumberLessThanTenValidator, replaceCommaValidator()]],
      diem11ky2: [null, [NumberLessThanTenValidator, replaceCommaValidator()]],
      diem12ky1: [null, [NumberLessThanTenValidator, replaceCommaValidator()]],
      diem12ky2: [null, [NumberLessThanTenValidator, replaceCommaValidator()]],
      status: [0],
      camket: [0, Validators.required],
      quoctich: [null],
      doituong: [''],
      ketqua_xetdaihoc: [null],
      chuongtrinhhoc: [null],
      trangthaitotnghiep: [null]
    });

  }


  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }

  ngOnInit(): void {
    this.loadInit();
  }

  loadInit() {
    this.getDataCitis();
  }

  getDataCitis() {
    forkJoin<[DiaDanh[], DanhMucDoiTuong[],DmTruongHoc[]]>(
      this.locationService.listProvinces(),
      this.danhMucDoituongUutienService.getdataUnlimit(),
      this.danhMucTruongHocService.getSogiaoduc(),
    ).subscribe({
      next: ([diadanh, doituong,sogiaoduc]) => {
        this.provinceOptions = diadanh;
        this.danhMucDoiTuong = doituong;
        this.dataSogiaoduc = sogiaoduc;
        if(this.provinceOptions.length>0 && this.danhMucDoiTuong.length>0 &&this.dataSogiaoduc.length>0 ){
          this._getDataUserInfo(this.auth.user.id);

        }
      }
    })

  }

  async _getDataUserInfo(user_id: number) {
    this.notifi.isProcessing(true);
    this.thisinhInfoService.getUserInfo(user_id).subscribe({
      next: data => {
        if (data && this.provinceOptions) {
          this.checkdata = 1;
          this.titleBtn = "Cập nhật thông tin";
          this.formActive = this.listForm[FormType.UPDATE];
          this.formActive.object = data;
          if (data.status === 1) {
            this.formSave.disable();
          }
          this.formSave.reset({
            user_id: this.auth.user.id,
            ten: data.ten,
            hoten: data.hoten,
            ngaysinh: data.ngaysinh,
            gioitinh: data.gioitinh,
            dantoc: data.dantoc,
            tongiao: data.tongiao,
            noisinh: data.noisinh,
            phone: data.phone,
            anh_chandung: data.anh_chandung,
            cccd_so: data.cccd_so,
            cccd_ngaycap: data.cccd_ngaycap,
            cccd_noicap: data.cccd_noicap,
            cccd_img_truoc: data.cccd_img_truoc,
            cccd_img_sau: data.cccd_img_sau,
            thuongtru_diachi: data.thuongtru_diachi,
            nguoinhan_hoten: data.nguoinhan_hoten,
            nguoinhan_phone: data.nguoinhan_phone,
            nguoinhan_diachi: data.nguoinhan_diachi, //{"fullAddress":"Xã An Phú, Huyện Củ Chi, Thành phố Hồ Chí Minh",
            khuvuc: data.khuvuc,
            namtotnghiep_thpt: data.namtotnghiep_thpt,
            lop10_thanhpho: data.lop10_thanhpho,
            lop11_thanhpho: data.lop11_thanhpho,
            lop12_thanhpho: data.lop12_thanhpho,
            lop10_department:data.lop10_department,
            lop11_department:data.lop11_department,
            lop12_department:data.lop12_department,
            lop10_truong: data.lop10_truong,
            lop11_truong: data.lop11_truong,
            lop12_truong: data.lop12_truong,
            diem10ky1: data.diem10ky1,
            diem10ky2: data.diem10ky2,
            diem11ky1: data.diem11ky1,
            diem11ky2: data.diem11ky2,
            diem12ky1: data.diem12ky1,
            diem12ky2: data.diem12ky2,
            status: data.status,
            camket: data.camket === 1 ? true : false,
            quoctich: data.quoctich === 1 ? true : false,
            doituong: data.doituong,
            ketqua_xetdaihoc: data.ketqua_xetdaihoc === 1 ? true : false,
            chuongtrinhhoc: data.chuongtrinhhoc,
            trangthaitotnghiep: data.trangthaitotnghiep,

          });
          this.changeInfoDepartment10(data.lop10_department)
          this.changeInfoDepartment11(data.lop11_department)
          this.changeInfoDepartment12(data.lop12_department)

          this.userInfo = data;
        } else {
          this.checkdata = 1;
          this.formActive = this.listForm[FormType.ADDITION];
          this.titleBtn = "Lưu thông tin";
          this.userInfo = null;
        }
        this.notifi.isProcessing(false);
      }, error: (e) => {
        this.notifi.isProcessing(false);
      }
    });

  }

  private __processFrom({data, object, type}: FormThisinh) {
    this.notifi.isProcessing(true);

    if (type === FormType.ADDITION) {
      this.thisinhInfoService.create(data).subscribe({
        next: () => {
          if (type === FormType.ADDITION) {
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
      })
    }
    if (type === FormType.UPDATE) {

      if(this.userInfo.request_update === 2){
        data['request_update'] = 0;
        data['lock'] = 1;
      }


      this.thisinhInfoService.update(object.id, data).subscribe({
        next: () => {
          if (type === FormType.ADDITION) {
            this.formActive = this.listForm[FormType.UPDATE];
          }
          this._getDataUserInfo(this.auth.user.id);
          this.notifi.isProcessing(false);
          this.notifi.toastSuccess('Thao tác thành công', 'Thông báo');
        },
        error: () => {
          this.notifi.isProcessing(false);
          this.notifi.toastError('Thao tác thất bại', 'Thông báo')
          this._getDataUserInfo(this.auth.user.id);
        }
      })
    }

  }

  saveForm() {
    if (this.formSave.valid) {
      this.f['ten'].setValue(this.f['hoten'].value.split(' ').pop());
      this.f['hoten'].setValue(this.f['hoten'].value?.toString().trim());
      this.f['nguoinhan_hoten'].setValue(this.f['nguoinhan_hoten'].value?.toString().trim());
      const mattruoc = this.f['cccd_img_truoc'].value[0] != null ? this.f['cccd_img_truoc'].value : null;
      const matsau = this.f['cccd_img_sau'].value[0] != null ? this.f['cccd_img_sau'].value : null;
      const anh_chandung = this.f['anh_chandung'].value[0] != null ? this.f['anh_chandung'].value : null;

      this.f['cccd_img_truoc'].setValue(mattruoc);
      this.f['cccd_img_sau'].setValue(matsau);
      this.f['anh_chandung'].setValue(anh_chandung);
      this.f['nguoinhan_hoten'].setValue(this.f['nguoinhan_hoten'].value?.toString().trim());

      const check_camket = this.f['camket'].value ? 1 : 0;
      this.f['camket'].setValue(check_camket);

      const check_ketqua_xetdaihoc = this.f['ketqua_xetdaihoc'].value ? 1 : 0;
      this.f['ketqua_xetdaihoc'].setValue(check_ketqua_xetdaihoc);

      const quoctich = this.f['quoctich'].value ? 1 : 0;
      this.f['quoctich'].setValue(quoctich);



      if (mattruoc && matsau && anh_chandung) {
        this.formActive.data = this.formSave.value;
        this.OBSERVE_PROCESS_FORM_DATA.next(this.formActive);
      } else {
        this.notifi.toastError('Vui lòng thêm ảnh');
      }
    } else {
      this.formSave.markAllAsTouched();
      this.notifi.toastError('Vui lòng nhập đúng và đủ thông tin.');
    }

  }

  async privateData() {

    if (this.userInfo) {
      const button = await this.notifi.confirmRounded('<p class="text-danger">Xác nhận</p>', 'Khoá thông tin', [BUTTON_NO, BUTTON_YES]);
      if (button.name === BUTTON_YES.name) {
        this.notifi.isProcessing(true);
        this.thisinhInfoService.update(this.userInfo.id, {status: 1}).subscribe({
          next: () => {
            this.notifi.toastSuccess('Khoá thông tin thành công');
            this.notifi.isProcessing(false);
            this._getDataUserInfo(this.auth.user.id);
          }, error: () => {
            this.notifi.toastError('Mất kết nối với máy chủ');
            this.notifi.isProcessing(false);
          }
        })
      }
    } else {
      this.notifi.toastWarning('Bạn chưa lưu thông tin thí sinh');
    }
  }

  changeThuongchu(event) {
    this.f['thuongtru_diachi'].setValue(event);
  }

  changeQuequan(event) {
    this.f['quequan'].setValue(event);
  }

  changeNguoinhandc(event) {
    this.f['nguoinhan_diachi'].setValue(event);

  }


  checkboxClicked(value: 'chuongtrinhhoc' | 'trangthaitotnghiep') {
    if (value === 'chuongtrinhhoc') {
      setTimeout(() => {
        if (Array.isArray(this.formSave.get('chuongtrinhhoc').value)) {
          this.formSave.get('chuongtrinhhoc').setValue([this.formSave.get('chuongtrinhhoc').value.pop()]);
        }
      }, 200);
    } else {
      setTimeout(() => {
        if (Array.isArray(this.formSave.get('trangthaitotnghiep').value)) {
          this.formSave.get('trangthaitotnghiep').setValue([this.formSave.get('trangthaitotnghiep').value.pop()]);
        }
      }, 200);
    }

  }
  truong10_isloadding:boolean=false;
  truong11_isloadding:boolean=false;
  truong12_isloadding:boolean=false;

   changeInfoDepartment10(department?: string, school?: string) {
    this.truong10_isloadding= true
    if (department) {

      const sogiaoducSelect = this.dataSogiaoduc.find(f=>f.ten === department)? this.dataSogiaoduc.find(f=>f.ten === department): null
      if(sogiaoducSelect){
         this.danhMucTruongHocService.getDataByParrentId(sogiaoducSelect.id).subscribe({
          next:(data)=>{
            this.datatruong10= data;
            this.truong10_isloadding= false;

          },error:()=>{
            this.truong10_isloadding= false;
            this.datatruong10= [];

          }
        })
      }else{
        this.datatruong10= [];
        this.f['lop10_truong'].setValue(null);

      }
    } else {
      this.f['lop10_truong'].setValue(null);
      this.datatruong10 = [];
    }

  }

   changeInfoDepartment11(department?: string, school?: string) {
    this.truong11_isloadding= true;
    if (department) {
      const sogiaoducSelect =this.dataSogiaoduc.find(f=>f.ten === department)? this.dataSogiaoduc.find(f=>f.ten === department): null

      if(sogiaoducSelect){
         this.danhMucTruongHocService.getDataByParrentId(sogiaoducSelect.id).subscribe({
          next:(data)=>{
            this.datatruong11= data;
            this.truong11_isloadding= false;

          },error:()=>{
            this.truong11_isloadding= false;
            this.datatruong11=[];
          }
        })
      }else{
        this.datatruong11=[];
        this.f['lop11_truong'].setValue(null);

      }
    } else {
      this.f['lop11_truong'].setValue(null);
      this.datatruong11 = [];
    }
  }

   changeInfoDepartment12(department?: string, school?: string) {
    this.truong12_isloadding= true;

    if (department) {
      const sogiaoducSelect =this.dataSogiaoduc.find(f=>f.ten === department)? this.dataSogiaoduc.find(f=>f.ten === department): null
      if(sogiaoducSelect){
         this.danhMucTruongHocService.getDataByParrentId(sogiaoducSelect.id).subscribe({
          next:(data)=>{
            this.datatruong12= data;
            this.truong12_isloadding= false;
          },error:()=>{
            this.truong12_isloadding= false;
            this.datatruong12=[];
          }
        })

      }else{
        this.datatruong10= [];
        this.f['lop12_truong'].setValue(null);

      }
    } else {
      this.f['lop12_truong'].setValue(null);
      this.datatruong12 = [];
    }
  }

  saveFormByRequsetUpdate(){

  }
  isRequestUpdate:boolean = false;
  async btnRequsetUpdate(){
    const button = await this.notifi.confirmRounded('Gửi yêu cầu cập nhật thông tin ','XÁC NHẬN',  [BUTTON_CANCEL,BUTTON_YES]);
    if (button.name === BUTTON_YES.name) {
      this.isRequestUpdate= true;
      this.thisinhInfoService.update(this.userInfo.id,{request_update:1}).subscribe({
        next:(data)=>{
          this._getDataUserInfo(this.auth.user.id)
          this.isRequestUpdate= false;
          this.notifi.toastSuccess('Yêu cầu đã được gửi đi, vui lòng quay lại sau.');

        },error:()=>{
          this.isRequestUpdate= false;
          this.notifi.toastError('Thao tác không thành công');
        }
      })
    }


  }

}
