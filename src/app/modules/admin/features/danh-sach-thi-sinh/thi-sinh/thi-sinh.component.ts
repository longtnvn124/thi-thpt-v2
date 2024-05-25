import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NotificationService} from "@core/services/notification.service";
import {ThisinhInfoService} from "@shared/services/thisinh-info.service";
import {ThiSinhInfo} from "@shared/models/thi-sinh";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {DDMMYYYYDateFormatValidator, NumberLessThanTenValidator, PhoneNumberValidator} from "@core/utils/validators";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {NgPaginateEvent} from "@shared/models/ovic-models";
import {Paginator} from "primeng/paginator";
import {debounceTime, forkJoin, Subject, Subscription} from "rxjs";
import {DanToc} from "@shared/utils/syscat";
import {DiaDanh} from "@shared/models/location";
import {DanhMucDoiTuong, DanhMucDoituongUutienService} from "@shared/services/danh-muc-doituong-uutien.service";
import {LocationService} from "@shared/services/location.service";

@Component({
  selector: 'app-thi-sinh',
  templateUrl: './thi-sinh.component.html',
  styleUrls: ['./thi-sinh.component.css']
})
export class ThiSinhComponent implements OnInit {
  @ViewChild('fromUpdate', {static: true}) template: TemplateRef<any>;
  @ViewChild('formAcount', {static: true}) formAcount: TemplateRef<any>;
  @ViewChild(Paginator) paginator: Paginator;
  listData: ThiSinhInfo[];
  page = 1;
  index = 1;
  recordsTotal: number = 0;
  formSave: FormGroup;
  search: string = '';
  menuName = 'thi-sinh';
  subscription = new Subscription();
  sizeFullWidth = 1024;
  rows = this.themeSettingsService.settings.rows;
  isLoading: boolean = true;
  private inputChanged: Subject<string> = new Subject<string>();
  thissinhSelect: ThiSinhInfo;
  provinceOptions:DiaDanh[];
  danhMucDoiTuong:DanhMucDoiTuong[];
  protected readonly dantoc = DanToc;

  khuvucdata = [
    {title: 'Khu vực 1', code: 'KV1'},
    {title: 'Khu vực 2', code: 'KV2'},
    {title: 'Khu vực 2 nông thôn', code: 'KV2-NT'},
    {title: 'Khu vực 3', code: 'KV3'}
  ]
  sex: { name: string, code: string }[] = [
    {name: 'Nữ', code: 'nu'},
    {name: 'Nam', code: 'nam'}
  ];
  chuongtrinhhoc: { id: number, value: string, label: string }[] = [
    {id: 1, label: 'Thí sinh học chương trình THPT ', value: 'THPT'},
    {id: 2, label: 'Thí sinh học chương trình GDTX ', value: 'GDTX'},
  ]
  trangthaitotnghiep: { id: number, value: number, label: string }[] = [
    {id: 1, label: 'Thí sinh tự do chưa tốt nghiệp THPT  ', value: 1},
    {id: 2, label: 'Thí sinh tự do đã tốt nghiệp THPT ', value: 0},
  ]

  thisinh_user_id:number = 0;
  constructor
  (
    private notificationService: NotificationService,
    private thisinhInfoService: ThisinhInfoService,
    private fb: FormBuilder,
    private themeSettingsService: ThemeSettingsService,
    private  locationService: LocationService,
    private  danhMucDoituongUutienService: DanhMucDoituongUutienService
  ) {
    const observerOnResize = this.notificationService.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
    this.formSave = this.fb.group({
      ten: [''],
      hoten: ['', Validators.required],
      ngaysinh: ['', [Validators.required, DDMMYYYYDateFormatValidator]],
      dantoc: ['', Validators.required],
      tongiao: [''],
      gioitinh: ['', Validators.required],
      noisinh: ['', Validators.required],
      phone: ['', [Validators.required, PhoneNumberValidator, Validators.minLength(6)]],
      anh_chandung: [null, Validators.required],
      cccd_so: ['', [Validators.required, PhoneNumberValidator]],
      cccd_ngaycap: ['', [Validators.required, DDMMYYYYDateFormatValidator]],
      cccd_noicap: ['Cục quản lý hành chính về TTXH', Validators.required],
      cccd_img_truoc: [null, Validators.required],
      cccd_img_sau: [null, Validators.required],
      thuongtru_diachi: [{}, Validators.required],
      nguoinhan_hoten: ['', Validators.required],
      nguoinhan_phone: ['', [Validators.required, PhoneNumberValidator, Validators.maxLength(12), Validators.minLength(6)]],
      nguoinhan_diachi: [null, Validators.required],
      khuvuc: [null, Validators.required],
      namtotnghiep_thpt: [null, [PhoneNumberValidator]],
      lop10_thanhpho: [null],
      lop11_thanhpho: [null],
      lop12_thanhpho: [null],
      lop10_truong: [''],
      lop11_truong: [''],
      lop12_truong: [''],
      diem10ky1: [null, [NumberLessThanTenValidator]],
      diem10ky2: [null, [NumberLessThanTenValidator]],
      diem11ky1: [null, [NumberLessThanTenValidator]],
      diem11ky2: [null, [NumberLessThanTenValidator]],
      diem12ky1: [null, [NumberLessThanTenValidator]],
      diem12ky2: [null, [NumberLessThanTenValidator]],
      status: [0],
      camket: [0, Validators.required],
      quoctich: [null],
      doituong: [''],
      ketqua_xetdaihoc: [null],
      chuongtrinhhoc: [null],
      trangthaitotnghiep: [null]
    });
  }

  ngOnInit(): void {
    this.inputChanged.pipe(debounceTime(1000)).subscribe((item: string) => {
      this.searchContentByInput(item);
    });
    this.getDataCitis();
    this.loadInit();
  }

  loadInit() {
    this.loadData(1);
  }

  getDataCitis() {
    forkJoin<[DiaDanh[], DanhMucDoiTuong[]]>(
      this.locationService.listProvinces(),
      this.danhMucDoituongUutienService.getdataUnlimit()
    ).subscribe({
      next: ([diadanh, doituong]) => {
        this.provinceOptions = diadanh;
        this.danhMucDoiTuong = doituong;

      }
    })

  }

  loadData(page: number, search ?: string) {
    const limit = this.themeSettingsService.settings.rows;
    this.index = (page * limit) - limit + 1;
    this.isLoading = true;
    this.page = page;
    this.notificationService.isProcessing(true);
    this.thisinhInfoService.load(page, search).subscribe({
      next: ({recordsTotal, data}) => {
        this.recordsTotal = recordsTotal;
        this.listData = data.map((m, index) => {
          m['_indexTable'] = this.rows * (page - 1) + index + 1;
          m['_gioitinh'] = m.gioitinh === 'nam' ? 'Nam' : "Nữ";
          return m;
        })
        this.isLoading = false;
        this.notificationService.isProcessing(false);
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Load dữ liệu không thành công');
      }
    })
  }

  paginate({page}: NgPaginateEvent) {
    this.page = page + 1;
    this.loadData(this.page);
  }

  onInputChange(event: string) {
    this.inputChanged.next(event);
  }
  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }
  searchContentByInput(value) {
    const data = value.trim();
    this.onSearch(data);
  }
  onSearch(text: string) {
    this.search = text;
    this.loadData(1, this.search);
  }

  private preSetupForm(name: string) {
    this.notificationService.isProcessing(false);
    this.notificationService.openSideNavigationMenu({
      name,
      template: this.template,
      size: 600,
      offsetTop: '0px'
    });
  }

  closeForm() {
    // this.loadInit();
    this.notificationService.closeSideNavigationMenu(this.menuName);
  }

  btnEDit(item: ThiSinhInfo) {
    this.thissinhSelect = item;
    this.notificationService.openSideNavigationMenu({
      name: this.menuName,
      template: this.template,
      size: this.sizeFullWidth,
      offsetTop: '0px'
    });

    this.formSave.reset({
      ten: item.ten,
      hoten: item.hoten,
      ngaysinh: item.ngaysinh,
      gioitinh: item.gioitinh,
      dantoc: item.dantoc,
      tongiao: item.tongiao,
      noisinh: item.noisinh,
      phone: item.phone,
      anh_chandung: item.anh_chandung,
      cccd_so: item.cccd_so,
      cccd_ngaycap: item.cccd_ngaycap,
      cccd_noicap: item.cccd_noicap,
      cccd_img_truoc: item.cccd_img_truoc,
      cccd_img_sau: item.cccd_img_sau,
      thuongtru_diachi: item.thuongtru_diachi,
      nguoinhan_hoten: item.nguoinhan_hoten,
      nguoinhan_phone: item.nguoinhan_phone,
      nguoinhan_diachi: item.nguoinhan_diachi, //{"fullAddress":"Xã An Phú, Huyện Củ Chi, Thành phố Hồ Chí Minh",
      khuvuc: item.khuvuc,
      namtotnghiep_thpt: item.namtotnghiep_thpt,
      lop10_thanhpho: item.lop10_thanhpho,
      lop11_thanhpho: item.lop11_thanhpho,
      lop12_thanhpho: item.lop12_thanhpho,
      lop10_truong: item.lop11_truong,
      lop11_truong: item.lop11_truong,
      lop12_truong: item.lop12_truong,
      diem10ky1: item.diem10ky1,
      diem10ky2: item.diem10ky2,
      diem11ky1: item.diem11ky1,
      diem11ky2: item.diem11ky2,
      diem12ky1: item.diem12ky1,
      diem12ky2: item.diem12ky2,
      status: item.status,
      camket: item.camket === 1 ? true : false,
      quoctich: item.quoctich === 1 ? true : false,
      doituong: item.doituong,
      ketqua_xetdaihoc: item.ketqua_xetdaihoc === 1 ? true : false,
      chuongtrinhhoc: item.chuongtrinhhoc,
      trangthaitotnghiep: item.trangthaitotnghiep,
    });
  }


  async btnDelete(item: ThiSinhInfo
  ) {const confirm = await this.notificationService.confirmDelete();
    if (confirm) {
      this.thisinhInfoService.delete(item.id).subscribe({
        next: () => {
          this.page = Math.max(1, this.page - (this.listData.length > 1 ? 0 : 1));
          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Thao tác thành công');
          this.loadData(this.page, this.search);

        }, error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Thao tác không thành công');
        }
      })
    }
  }

  btnSaveEdit() {
    if(this.thissinhSelect){
      this.thisinhInfoService.update(this.thissinhSelect.id,this.formSave.value).subscribe({
        next:()=>{

          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Cập nhật dữ liệu thành công');

        },error:()=>{
          this.notificationService.toastError('Cập nhật dữ liệu không thành công');
          this.notificationService.isProcessing(false);

        }
      })
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
  checkboxClicked(value:'chuongtrinhhoc' | 'trangthaitotnghiep') {
    if(value === 'chuongtrinhhoc'){
      setTimeout(() => {
        if (Array.isArray(this.formSave.get('chuongtrinhhoc').value)) {
          this.formSave.get('chuongtrinhhoc').setValue([this.formSave.get('chuongtrinhhoc').value.pop()]);
        }
      }, 200);
    }else{
      setTimeout(() => {
        if (Array.isArray(this.formSave.get('trangthaitotnghiep').value)) {
          this.formSave.get('trangthaitotnghiep').setValue([this.formSave.get('trangthaitotnghiep').value.pop()]);
        }
      }, 200);
    }

  }

  btnEditAcount(item:ThiSinhInfo){
    this.thissinhSelect = item;

    this.notificationService.openSideNavigationMenu({
      name: this.menuName,
      template: this.formAcount,
      size: this.sizeFullWidth,
      offsetTop: '0px'
    });

    this.thisinh_user_id = item.user_id;
  }
}
