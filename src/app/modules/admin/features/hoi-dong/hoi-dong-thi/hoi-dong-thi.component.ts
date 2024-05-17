
import { NotificationService } from '@core/services/notification.service';
import { ThptKehoachThiService, KeHoachThi } from './../../../../shared/services/thpt-kehoach-thi.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThptHoiDong, ThptHoiDongService } from '@modules/shared/services/thpt-hoi-dong.service';
import { FormType, OvicForm } from '@modules/shared/models/ovic-models';
import {Observable, Subject, Subscription, debounceTime, filter, concatMap, forkJoin, of} from 'rxjs';
import {AddThiSinhComponent} from "@modules/admin/features/hoi-dong/hoi-dong-thi/add-thi-sinh/add-thi-sinh.component";
import {ThptCathi, ThptHoidongCathiService} from "@shared/services/thpt-hoidong-cathi.service";
import {ThptHoidongPhongthiService} from "@shared/services/thpt-hoidong-phongthi.service";
import {ThptPhongThiMonThi, ThptPhongthiMonthiService} from "@shared/services/thpt-phongthi-monthi.service";
import {map} from "rxjs/operators";
import {ThptHoiDongPhongThi} from "@shared/models/thpt-model";
import {HelperService} from "@core/services/helper.service";
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {DmMon} from "@shared/models/danh-muc";
import {ExpostExcelPhongthiThisinhService} from "@shared/services/expost-excel-phongthi-thisinh.service";

interface FormHoiDong extends OvicForm {
  object: ThptHoiDong;
}
export interface itemExportExcel{
  sheet_name      : string;
  header_Cathi    : string;
  header_ngaythi  : string;
  header_phongthi : string;
  monthi          : string;
  time_start      : string;
  thisinh         : {stt:number;sbd:string,hoten:string,ngaysinh:string,gioitinh:string,noisinh:string, cccdSo:number}[];

}

@Component({
  selector: 'app-hoi-dong-thi',
  templateUrl: './hoi-dong-thi.component.html',
  styleUrls: ['./hoi-dong-thi.component.css']
})
export class HoiDongThiComponent implements OnInit {
  @ViewChild('fromUpdate', { static: true }) template: TemplateRef<any>;
  @ViewChild('examinationRoom', { static: true }) examinationRoom: TemplateRef<any>;
  @ViewChild('addThiSinh', { static: true }) addThiSinh: TemplateRef<any>;
  @ViewChild(AddThiSinhComponent) addThisinhComponent: AddThiSinhComponent;

  statusList = [
    {value: 1, label: 'Active', color: '<span class="badge badge--size-normal badge-success w-100">Active</span>'},
    {value: 0, label: 'Inactive', color: '<span class="badge badge--size-normal badge-danger w-100">Inactive</span>'}
  ];
  listForm = {
    [FormType.ADDITION]: { type: FormType.ADDITION, title: 'Thêm mới hội đồng', object: null, data: null },
    [FormType.UPDATE]: { type: FormType.UPDATE, title: 'Cập nhật hội đồng', object: null, data: null }
  };

  formActive: FormHoiDong;
  formSave: FormGroup;
  isLoading: boolean = true;
  loadInitFail: boolean = false;
  dataKeHoach: KeHoachThi[];
  subscription = new Subscription();
  sizeFullWidth = 1024;
  needUpdate = false;
  menuName: 'hoi-dong';
  btn_checkAdd: 'Lưu lại' | 'Cập nhật';
  _kehoach_id: number;
  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormHoiDong>();
  hoidong_id: number;
  listData: ThptHoiDong[];
  kehoach_id_param: number;
  thiSinhSelectTotal:number= 0;
  orderSelectTotal:number= 0;
  dmMon:DmMon[];
  hoidongSelect:ThptHoiDong;
  constructor(
    private kehoachThiService: ThptKehoachThiService,
    private hoiDongService: ThptHoiDongService,
    private notifi: NotificationService,
    private fb: FormBuilder,
    private thptHoidongCathiService :ThptHoidongCathiService,
    private thptHoidongPhongthiService:ThptHoidongPhongthiService,
    private thptPhongthiMonthiService:ThptPhongthiMonthiService,
    private helperService: HelperService,
    private danhMucMonService: DanhMucMonService,
    private expostExcelPhongthiThisinhService:ExpostExcelPhongthiThisinhService

  ) {
    const observeProcessFormData = this.OBSERVE_PROCESS_FORM_DATA.asObservable().pipe(debounceTime(100)).subscribe(form => this.__processFrom(form));
    this.subscription.add(observeProcessFormData);
    const observeProcessCloseForm = this.notifi.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData());
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notifi.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);

    this.formSave = this.fb.group({
      kehoach_id: [null, Validators.required],
      ten_hoidong: ['', Validators.required],
      mota: [null],
      status: [1, Validators.required],
    })
  }

  ngOnInit(): void {
    this.loadInit()
  }
  loadInit() {
    this.danhMucMonService.getDataUnlimit().subscribe({
      next:(data)=>{
        this.dmMon = data;
      }
    })
    this.loadData();
  }
  loadData() {
    this.getDataKeHoach();
  }
  getDataKeHoach() {
    this.notifi.isProcessing(true)
    this.isLoading = true;
    this.kehoachThiService.getDataUnlimit().subscribe({
      next: (data) => {
        this.dataKeHoach = data;
        this.getDataHoiDong();
        this.notifi.isProcessing(false);
        this.isLoading = false;
      }, error: (e) => {
        this.notifi.isProcessing(false);
        this.isLoading = false;
        this.notifi.toastError('Mất kết nối với máy chủ');
      }
    })
  }
  changeSelectData(event) {
    this._kehoach_id = event;
    this.getDataHoiDong(event);
  }
  getDataHoiDong(kehoach_id?: number, search?: string) {
    this.isLoading = true;
    this.notifi.isProcessing(true);
    this.hoiDongService.loadDataUnlimit(kehoach_id).subscribe({
      next: (data) => {
        let i = 1;
        this.listData = data.map(m => {
          m['__indexTable'] = i++;
          m['__kehoach_coverted'] = this.dataKeHoach && this.dataKeHoach.find(f => f.id === m.kehoach_id) ? this.dataKeHoach.find(f => f.id === m.kehoach_id).dotthi : '';
          const sIndex = this.statusList.findIndex(i => i.value === m.status);
          m['__status_converted'] = sIndex !== -1 ? this.statusList[sIndex].color : '';
          return m;
        })
        this.isLoading = false;
        this.notifi.isProcessing(false);
      },
      error: (e) => {
        this.isLoading = false;
        this.notifi.isProcessing(false);
      }
    })
  }
  private __processFrom({ data, object, type }: FormHoiDong) {
    this.isLoading = true;
    const observer$: Observable<any> = type === FormType.ADDITION ? this.hoiDongService.create(data) : this.hoiDongService.update(object.id, data);
    observer$.subscribe({
      next: () => {
        this.needUpdate = true;
        if (type === FormType.ADDITION) {
          this.formSave.reset({
            kehoach_id: null,
            ten_hoidong: '',
            mota: '',
            status: 1
          });
        }
        this.getDataHoiDong(this._kehoach_id);
        this.isLoading = false;
        this.notifi.toastSuccess('Thao tác thành công', 'Thông báo');
      },
      error: () => {
        this.isLoading = false;
        this.notifi.toastError('Thao tác thất bại', 'Thông báo');
      }
    });
  }
  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }
  changeInput(text) {

  }
  btnAddNew(type: 'add' | 'update', item?: ThptHoiDong) {
    if (type === 'add') {
      this.btn_checkAdd = "Lưu lại";
      this.formActive = this.listForm[FormType.ADDITION];
      this.preSetupForm(this.menuName);
      this.formSave.reset({
        kehoach_id: null,
        ten_hoidong: '',
        mota: '',
        status: 1
      });
    }
    else if (type === 'update') {
      this.btn_checkAdd = "Cập nhật"
      const object1 = this.listData.find(u => u.id === item.id);
      this.formSave.reset({
        kehoach_id: object1.kehoach_id,
        ten_hoidong: object1.ten_hoidong,
        mota: object1.mota,
        status: object1.status
      });
      this.formActive = this.listForm[FormType.UPDATE];
      this.formActive.object = object1;
      this.preSetupForm(this.menuName);
    }
  }
  private preSetupForm(name: string) {
    this.notifi.isProcessing(false);
    this.notifi.openSideNavigationMenu({
      name: name,
      template: this.template,
      size: 1024,
      offsetTop: '0px'
    });
  }
  closeForm() {
    this.loadInit();
    this.notifi.closeSideNavigationMenu(this.menuName);
  }
  saveForm() {
    const titleInput = this.f['ten_hoidong'].value.trim();
    this.f['ten_hoidong'].setValue(titleInput);
    if (this.formSave.valid) {
      if (titleInput !== '') {
        this.formActive.data = this.formSave.value;
        this.OBSERVE_PROCESS_FORM_DATA.next(this.formActive);
      } else {
        this.notifi.toastWarning('Vui lòng không nhập khoảng trống');
      }
    } else {
      this.formSave.markAllAsTouched();
      this.notifi.toastWarning('Vui lòng nhập đủ thông tin');
    }
  }
  async btnDelete(item: ThptHoiDong) {
    const confirm = await this.notifi.confirmDelete();
    if (confirm) {
      this.hoiDongService.delete(item.id).subscribe({
        next: () => {
          // this.page = Math.max(1, this.page - (this.listData.length > 1 ? 0 : 1));
          this.notifi.isProcessing(false);
          this.notifi.toastSuccess('Thao tác thành công');
          this.getDataHoiDong(this._kehoach_id);

        }, error: () => {
          this.notifi.isProcessing(false);
          this.notifi.toastError('Thao tác không thành công');
        }
      })
    }
  }
  btnViewPhongThi(item: ThptHoiDong) {
    this.notifi.isProcessing(false);
    this.notifi.openSideNavigationMenu({
      template: this.examinationRoom,
      size: this.sizeFullWidth,
      offsetTop: '0px'
    });
    this.hoidong_id = item.id;
    this.kehoach_id_param = item.kehoach_id;
  }
  btnAddThisinh(item: ThptHoiDong) {
    this.notifi.isProcessing(false);
    this.hoidong_id = item.id;
    this.kehoach_id_param = item.kehoach_id;
    this.notifi.openSideNavigationMenu({
      template: this.addThiSinh,
      size: this.sizeFullWidth,
      offsetTop: '0px'
    });
  }
  btnCreateThisinhInHoiDOng(){
    this.addThisinhComponent.btnAddHoidong();
  }
  btnDeleteThiSinhInHoiDong(){
    this.addThisinhComponent.btndelete();
  }
  btnReloadData(){
    this.addThisinhComponent.loadData();
  }
  onDataChange(event){
    this.thiSinhSelectTotal=event.thisinhSelect;
    this.orderSelectTotal=event.orderSelect;
  }


  btnExportExcel(item: ThptHoiDong){
    this.hoidongSelect = item;
    this.thptHoidongCathiService.getDataUnlimitByhoidongId(item.id).pipe(
      concatMap(cathi => {
        const cathiIds = cathi.map(m => m.id);
        return forkJoin(
          of(cathi), this.thptHoidongPhongthiService.getDataByHoidongVaCathiId(item.id, cathiIds).pipe(concatMap(prj => {
            const phongthi_ids = prj.map(a => a.id);
              return forkJoin<[ThptHoiDongPhongThi[], ThptPhongThiMonThi[]]>(
                of(prj),
                this.thptPhongthiMonthiService.getDataByphongthiIds(phongthi_ids)
              );
            })));}))
    .subscribe({
      next:(data)=>{
        const dataCathi =data[0] ? data[0] : [];
        const dataPhongthi =data[1][0] ? data[1][0].map(m=>{
          const cathi =  dataCathi.find(f=>f.id === m.cathi_id);
          m['__cathi_Covented'] = cathi ? cathi.cathi: '';
          m['__ngaythi'] = cathi ? this.helperService.formatSQLToDateDMY(new Date(cathi.ngaythi)): '';
          return m;
        }) : [];
        const dataPhongthiMonThi = data[1][1] ? data[1][1].filter(f=>f.thisinh_ids.length !== 0).sort((a, b)=> a.phongthi_id - b.phongthi_id).map(m=>{

          m['__phongthi'] = dataPhongthi.find(f=>f.id === m.phongthi_id);
          m['__thisinh_sapxep'] = m.thisinh_ids.map(a=> m['thisinh'].find( b=>b.id === a));
          return m;
        }) : [];
        if( dataCathi.length !== 0 && dataPhongthi.length !== 0 && dataPhongthiMonThi.length !== 0 ){
          const dataExxport  : any[] =  [];
          dataPhongthiMonThi.forEach(monthi =>{
            const phongthi = monthi['__phongthi'];
            const thisinhParram = monthi['__thisinh_sapxep'].map((m,index)=>{
              m['__index'] = index +1;
              m['__sbd'] = 'TNU'+ m.id;
              m['__gioitinh'] = m.gioitinh === 'nu' ? 'Nữ': 'Nam';
              return {stt: m['__index'],sbd:m['__sbd'],hoten:m.hoten,ngaysinh:m.ngaysinh,gioitinh: m['__gioitinh'],noisinh:m.noisinh, cccdSo:m.cccd_so,phone:m.phone}
            })
            const item : itemExportExcel = {
              sheet_name: phongthi['__cathi_Covented'] +', '+ phongthi.ten_phongthi +'( '+ this.dmMon.find(f=>f.id === monthi.monthi_id).tenmon + ' )' ,
              header_Cathi: phongthi ? phongthi['__cathi_Covented']: '',
              header_phongthi: phongthi ? phongthi.ten_phongthi : '',
              header_ngaythi: phongthi ? phongthi['__ngaythi'] : '',
              monthi : this.dmMon.find(f=>f.id === monthi.monthi_id).tenmon,
              time_start : monthi.timeStart,
              thisinh :thisinhParram
            }
            dataExxport.push(item);
          })
          console.log(dataExxport);
          this.expostExcelPhongthiThisinhService.exportExcelToHoidong(item.ten_hoidong,this.columns,dataExxport )
        }else{
          this.notifi.toastError('Người dùng chưa tạo phòng thi, vui lòng tạo phòng thi !')
        }


        this.isLoading = false;
      },error:()=>{
        this.isLoading = false;
        this.notifi.toastWarning('Load dữ liệu không thành công');
      }
    })
  }

  columns = ['STT','Số báo danh', 'Họ và tên','Ngày sinh','Giới tính','Nơi sinh','Số căn cước công dân','Số điện thoại'];

}
