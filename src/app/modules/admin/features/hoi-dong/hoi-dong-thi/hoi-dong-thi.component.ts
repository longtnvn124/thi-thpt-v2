import {NotificationService} from '@core/services/notification.service';
import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ThptHoiDong, ThptHoiDongService} from '@modules/shared/services/thpt-hoi-dong.service';
import {FormType, NgPaginateEvent, OvicForm} from '@modules/shared/models/ovic-models';
import {Observable, Subject, Subscription, debounceTime, filter, concatMap, forkJoin, of, switchMap} from 'rxjs';
import {AddThiSinhComponent} from "@modules/admin/features/hoi-dong/hoi-dong-thi/add-thi-sinh/add-thi-sinh.component";
import {ThptCathi, ThptHoidongCathiService} from "@shared/services/thpt-hoidong-cathi.service";
import {ThptHoidongPhongthiService} from "@shared/services/thpt-hoidong-phongthi.service";
import {ThptPhongThiMonThi, ThptPhongthiMonthiService} from "@shared/services/thpt-phongthi-monthi.service";
import {ThptHoiDongPhongThi} from "@shared/models/thpt-model";
import {HelperService} from "@core/services/helper.service";
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {DmMon} from "@shared/models/danh-muc";
import {ExpostExcelPhongthiThisinhService} from "@shared/services/expost-excel-phongthi-thisinh.service";
import {ThptHoidongThisinhService} from "@shared/services/thpt-hoidong-thisinh.service";
import {DatePipe} from "@angular/common";
import {HoiDongLichThiService, ThptLichThi} from "@shared/services/hoi-dong-lich-thi.service";
import {KeHoachThi, ThptKehoachThiService} from "@shared/services/thpt-kehoach-thi.service";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {Paginator} from "primeng/paginator";
import {HtmlToPdfService} from "@shared/services/html-to-pdf.service";
import {BUTTON_NO, BUTTON_YES} from "@core/models/buttons";
import {ThisinhInfoService} from "@shared/services/thisinh-info.service";

interface FormHoiDong extends OvicForm {
  object: ThptHoiDong;
}

export interface itemExportExcel {
  sheet_name: string;
  header_Cathi: string;
  header_ngaythi: string;
  header_phongthi: string;
  monthi: string;
  time_start: string;
  thisinh: {
    stt: number;
    sbd: string,
    hoten: string,
    ngaysinh: string,
    gioitinh: string,
    noisinh: string,
    cccdSo: number
  }[];

}

@Component({
  selector: 'app-hoi-dong-thi',
  templateUrl: './hoi-dong-thi.component.html',
  styleUrls: ['./hoi-dong-thi.component.css']
})
export class HoiDongThiComponent implements OnInit {
  @ViewChild(Paginator) paginator: Paginator;
  @ViewChild('fromUpdate', {static: true}) template: TemplateRef<any>;
  @ViewChild('examinationRoom', {static: true}) examinationRoom: TemplateRef<any>;
  @ViewChild('addThiSinh', {static: true}) addThiSinh: TemplateRef<any>;
  @ViewChild(AddThiSinhComponent) addThisinhComponent: AddThiSinhComponent;
  @ViewChild('thiSinhInPhongThi', {static: true}) thiSinhInPhongThi: TemplateRef<any>;
  @ViewChild('ViewThongKe', {static: true}) viewThongKe: TemplateRef<any>;

  statusList = [
    {
      value: 1,
      label: 'Đã Kích hoạt',
      color: '<span class="badge badge--size-normal badge-success w-100">Đã Kích hoạt</span>'
    },
    {
      value: 0,
      label: 'Chưa kích hoạt',
      color: '<span class="badge badge--size-normal badge-danger w-100">Chưa kích hoạt</span>'
    }
  ];
  listForm = {
    [FormType.ADDITION]: {type: FormType.ADDITION, title: 'Thêm mới hội đồng', object: null, data: null},
    [FormType.UPDATE]: {type: FormType.UPDATE, title: 'Cập nhật hội đồng', object: null, data: null}
  };
  rows = this.themeSettings.settings.rows;
  page: number = 1;
  recordsTotal: number = 0;
  search: string = '';
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
  thiSinhSelectTotal: number = 0;
  orderSelectTotal: number = 0;
  dmMon: DmMon[];
  thptLichthi: ThptLichThi[];


  columns = ['STT'
    , 'ID', 'MADK', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'CCCD/CMND', 'Email',
    'Số điện thoại', 'Đăng ký môn Toán', 'Đăng ký môn Vật lí', 'Đăng ký môn Hóa học', 'Đăng ký môn Sinh học',
    'Đăng ký môn Lịch sử', 'Đăng ký môn Địa lí', 'Đăng ký môn Tiếng anh',
    'SBD Toán', 'Ca thi Toán', 'Địa điểm thi Toán', 'Phòng thi Toán', 'Thời điểm gọi vào Toán',
    'SBD Vật lí', 'Ca thi Vật lí', 'Địa điểm thi Vật lí', 'Phòng thi Vật lí', 'Thời điểm gọi vào Vật lí',
    'SBD Hóa học', 'Ca thi Hóa học', 'Địa điểm thi Hóa học', 'Phòng thi Hóa học', 'Thời điểm gọi vào Hóa học',
    'SBD Sinh học', 'Ca thi Sinh học', 'Địa điểm thi Sinh học', 'Phòng thi Sinh học', 'Thời điểm gọi vào Sinh học',
    'SBD Lịch sử', 'Ca thi Lịch sử', 'Địa điểm thi Lịch sử', 'Phòng thi Lịch sử', 'Thời điểm gọi vào Lịch sử',
    'SBD Địa lí', 'Ca thi Địa lí', 'Địa điểm thi Địa lí', 'Phòng thi Địa lí', 'Thời điểm gọi vào Địa lí',
    'SBD Tiếng Anh', 'Ca thi Tiếng Anh', 'Địa điểm thi Tiếng Anh', 'Phòng thi Tiếng Anh', 'Thời điểm gọi vào Tiếng Anh',
  ];

  columnSheet2 = [
    'Ca', 'Phòng', 'Toán', 'Vật lí', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lí', 'Tiếng Anh', 'Thời điểm gọi thí sinh', 'Địa điểm'
  ]

  hoidong_select: ThptHoiDong;

  private inputChanged: Subject<string> = new Subject<string>();

  tientos:ThptHoiDong[];
  constructor(
    private themeSettings: ThemeSettingsService,
    private kehoachThiService: ThptKehoachThiService,
    private hoiDongService: ThptHoiDongService,
    private notifi: NotificationService,
    private fb: FormBuilder,
    private thptHoidongCathiService: ThptHoidongCathiService,
    private thptHoidongPhongthiService: ThptHoidongPhongthiService,
    private thptPhongthiMonthiService: ThptPhongthiMonthiService,
    private helperService: HelperService,
    private danhMucMonService: DanhMucMonService,
    private expostExcelPhongthiThisinhService: ExpostExcelPhongthiThisinhService,
    private hoiDongThiSinhService: ThptHoidongThisinhService,
    private thptLichthiSerive: HoiDongLichThiService,
    private thptHoidongThisinhService: ThptHoidongThisinhService,
    private htmlToPdfService:HtmlToPdfService,
    private thisinhInfo:ThisinhInfoService
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
      tiento_sobaodanh: ['TNU241',Validators.required],
      ngaythi: ['', Validators.required],
    })
  }


  ngOnInit(): void {
    this.inputChanged.pipe(debounceTime(1000)).subscribe((item: string) => {
      this.searchContentByInput(item);
    });
    this.loadInit()
  }

  loadInit() {
    this.notifi.isProcessing(true)
    this.isLoading = true;
    forkJoin<[DmMon[], ThptLichThi[], KeHoachThi[], ThptHoiDong[]]>(
      this.danhMucMonService.getDataUnlimit(),
      this.thptLichthiSerive.getDataUnlimit(),
      this.kehoachThiService.getDataUnlimitNotstatus(),
      this.hoiDongService.getTientosobaodanhUnlimit()
    ).subscribe({
      next: ([dmMon, lichthi, data,tiento]) => {
        this.dmMon = dmMon;
        this.thptLichthi = lichthi;
        this.dataKeHoach = data;
        this.tientos = tiento
        if (this.dmMon && this.thptLichthi && this.dataKeHoach) {
          this.loadData()
        }
        this.notifi.isProcessing(false);
        this.isLoading = false;
      }, error: () => {
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

  loadData() {
    this.getDataHoiDong(1)
  }


  getDataHoiDong(page: number) {
    this.isLoading = true;
    this.notifi.isProcessing(true);
    this.page = page;
    this.hoiDongService.getDataBypageAndkehoachAndSearch(this.page, this._kehoach_id, this.search).pipe(switchMap(prj => {
      return this.loadThisinhByHoidong(prj)
    })).subscribe({
      next: ({recordsTotal, data}) => {
        this.recordsTotal = recordsTotal;
        this.listData = data.map((m, index) => {
          m['__indexTable'] = index + 1 + (this.page - 1) * 10;
          m['__kehoach_coverted'] = this.dataKeHoach && this.dataKeHoach.find(f => f.id === m.kehoach_id) ? this.dataKeHoach.find(f => f.id === m.kehoach_id).dotthi : '';
          const sIndex = this.statusList.findIndex(i => i.value === m.status);
          m['__status_converted'] = sIndex !== -1 ? this.statusList[sIndex].color : '';
          m['__ngaythi'] = m.ngaythi ? this.helperService.formatSQLToDateDMY(new Date(m.ngaythi)) : "";
          const thisinhData = m['thisinhData'];
          m['__total'] = thisinhData ? thisinhData.length : 0;
          this.dmMon.forEach(f => {
            m['__mon_' + f.kyhieu.toLowerCase()] = thisinhData ? this.covernumber(this.countOccurrences(f.id, thisinhData)) : '00';
          })


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
  private loadThisinhByHoidong(input: { recordsTotal: number; data: ThptHoiDong[] }): Observable<{
    recordsTotal: number;
    data: ThptHoiDong[]
  }> {
    try {
      const index: number = input.data.findIndex(t => !t['_haveThisinh']);
      if (index !== -1) {
        return this.thptHoidongThisinhService.getDataUnlimitSelectByhoidongId(input.data[index].id).pipe(
          switchMap(m => {
            input.data[index]['_haveThisinh'] = true;
            input.data[index]['thisinhData'] = m;
            return this.loadThisinhByHoidong(input);
          })
        );
      } else {
        return of(input);
      }
    } catch (e) {
      return of(input);
    }
  }

  private __processFrom({data, object, type}: FormHoiDong) {
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
            status: 1,
            ngaythi: '',
            tiento_sobaodanh:'TNU241'
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

  searchContentByInput(text: string) {
    this.page = 1;
    this.search = text.trim();
    this.getDataHoiDong(this.page);
  }

  onInputChange(event: string) {
    this.inputChanged.next(event);
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
        status: 1,
        tiento_sobaodanh: 'TNU241',
        ngaythi: ''
      });
    } else if (type === 'update') {
      this.btn_checkAdd = "Cập nhật"
      const object1 = this.listData.find(u => u.id === item.id);
      this.formSave.reset({
        kehoach_id: object1.kehoach_id,
        ten_hoidong: object1.ten_hoidong,
        mota: object1.mota,
        status: object1.status,
        tiento_sobaodanh: object1.tiento_sobaodanh,
        ngaythi: object1.ngaythi ? new Date(object1.ngaythi) : null
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

  formatSQLDateTime(date: Date): string {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    //'YYYY-MM-DD hh:mm:ss' type of sql DATETIME format
    return `${y}-${m}-${d}`;
  }

  saveForm() {
    const titleInput = this.f['ten_hoidong'].value.trim();

    if(this.formActive === this.listForm[FormType.ADDITION] ){
      const tiento = this.tientos.find(f=>f.tiento_sobaodanh === this.f['tiento_sobaodanh'].value ) ? '' : this.f['tiento_sobaodanh'].value;
      this.f['tiento_sobaodanh'].setValue(tiento)
      if(tiento === ''){
        this.notifi.toastWarning('Tiền tố số báo danh đã trùng với hội đồng khác, vui lòng nhập lại ');
      }
    }

    const object = {
      ten_hoidong: titleInput,
      ngaythi: this.formatSQLDateTime(new Date(this.formSave.value['ngaythi'])),
      kehoach_id: this.f['kehoach_id'].value,
      mota: this.f['mota'].value,
      status: this.f['status'].value,
      tiento_sobaodanh: this.f['tiento_sobaodanh'].value,
    }

    if (this.formSave.valid) {
      if (titleInput !== '') {
        this.formActive.data = object;
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
          this.listData.filter(f => f.id !== item.id)
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

  btnCreateThisinhInHoiDOng() {
    this.addThisinhComponent.btnAddHoidong();
  }

  btnDeleteThiSinhInHoiDong() {
    this.addThisinhComponent.btndelete();
  }

  btnUpdateRoombyThisinh() {
    this.addThisinhComponent.btnXepphong()
  }

  btnUpdateCompactRoom() {
    this.addThisinhComponent.btnCompactRoom()
  }

  btnReloadData() {
    this.addThisinhComponent.loadData();
  }

  onDataChange(event) {
    this.thiSinhSelectTotal = event.thisinhSelect;
    this.orderSelectTotal = event.orderSelect;
  }


  btnExportExcelV2(hoidong: ThptHoiDong) {

    this.notifi.isProcessing(true);
    forkJoin(
      this.hoiDongThiSinhService.getDataByHoiDongIdNotPage(hoidong.id),
      this.thptHoidongCathiService.getDataUnlimitByhoidongId(hoidong.id).pipe(
        concatMap(cathi => {
          const cathiIds = cathi.map(m => m.id);
          return forkJoin(of(cathi), this.thptHoidongPhongthiService.getDataByHoidongVaCathiIds(hoidong.id, cathiIds));
        }))
    ).subscribe(
      {
        next: (data) => {
          const dataThisinh = data[0];
          const dataCathi: ThptCathi[] = data[1][0].map(m => {
            m['__time_start'] = m ? (this.covernumber(new Date(m.time_start).getHours()) + ':' + this.covernumber(new Date(m.time_start).getMinutes())) : '';
            return m;
          });
          const dataPhongthi: ThptHoiDongPhongThi[] = data[1][1].map(m => {
            const cathi = dataCathi.find(f => f.id === m.cathi_id);
            m['__cathi_Covented'] = cathi ? cathi.cathi : '';
            m['__ngaythi'] = cathi ? this.helperService.formatSQLToDateDMY(new Date(cathi.ngaythi)) : '';
            m['__time_start'] = cathi ? (this.covernumber(new Date(cathi.time_start).getHours()) + ':' + this.covernumber(new Date(cathi.time_start).getMinutes())) : '';
            return m;
          });

          if (dataThisinh.length > 0 && dataCathi.length > 0 && dataPhongthi.length) {
            const thisinhsExpostExcel = [];
            dataThisinh.forEach((m, index) => {
              const datePipe = new DatePipe('en-US');
              const item = {};
              const thisinh = m['thisinh'];
              item['__indexTable'] = index + 1;
              item['__thisinh_id'] = thisinh ? thisinh['id'] : '';
              item['__madk'] = m['sobaodanh'];
              item['__hoten'] = thisinh ? thisinh['hoten'] : '';
              item['__ngaysinh'] = thisinh ? this.repplaceNgaysinh(thisinh['ngaysinh']) : '';
              item['__gioitinh'] = thisinh && thisinh['gioitinh'] === 'nam' ? 'Nam' : (thisinh && thisinh['gioitinh'] === 'nu' ? 'Nữ' : '');
              item['__cccd'] = thisinh ? thisinh['cccd_so'] : '';
              item['__email'] = thisinh ? thisinh['email'] : '';
              item['__phone'] = thisinh ? thisinh['phone'] : '';

              this.dmMon.map(a => {
                item['__mon_' + a.kyhieu] = m.monthi_ids.find(f => f === a.id) ? a.tenmon : '';
              })
              this.dmMon.map(a => {
                const cathiselect = dataCathi.find(f => f.mon_ids.find(mon => mon === a.id));
                const phongthi = dataPhongthi.find(phongthi => phongthi.thisinh_ids.find(id => id === m.thisinh_id) && phongthi.cathi_id === cathiselect.id);
                item['__sbd_' + a.kyhieu] = m.monthi_ids.find(mon_id => mon_id === a.id) ? m['sobaodanh'] : '';
                item['__cathi_' + a.kyhieu] = m.monthi_ids.find(mon_id => mon_id === a.id) && cathiselect ? cathiselect.cathi : '';
                item['__diadiem_' + a.kyhieu] = m.monthi_ids.find(mon_id => mon_id === a.id) ? 'Trung tâm Khảo thí và Quản lý chất lượng – ĐHTN, Phường Tân Thịnh – Thành phố Thái Nguyên' : '';
                item['__phongthi_' + a.kyhieu] = m.monthi_ids.find(mon_id => mon_id === a.id) && phongthi ? phongthi.ten_phongthi : '';
                item['__timeStart_' + a.kyhieu] = m.monthi_ids.find(mon_id => mon_id === a.id) && cathiselect && phongthi ? cathiselect['__time_start'].replace(':', 'g') + ' ngày ' + phongthi['__ngaythi'] : '';
              })

              thisinhsExpostExcel.push(item);
            })

            const dataPhongthiExport: any[] = [];
            dataPhongthi.forEach((f, index) => {
              const item = {};
              item["cathi"] = f['__cathi_Covented'];
              item['phong'] = f.ten_phongthi;

              this.dmMon.forEach(dm => {
                const cathiselect = dataCathi.find(ct => ct.id === f.cathi_id).mon_ids.find(id => id === dm.id)
                item['__monthi_' + dm.kyhieu] = cathiselect ? dm.tenmon : '';
              });
              item['__timeStart'] = f ? f['__time_start'].replace(':', 'g') + ' ngày ' + f['__ngaythi'] : '';
              item['diadiem'] = f ? 'Trung tâm Khảo thí và Quản lý chất lượng – ĐHTN, Phường Tân Thịnh – Thành phố Thái Nguyên' : '';
              dataPhongthiExport.push(item)

            })
            this.expostExcelPhongthiThisinhService.exportExcel(thisinhsExpostExcel, this.columns, hoidong.ten_hoidong, dataPhongthiExport, this.columnSheet2);

          } else {
            this.notifi.toastWarning('Vui lòng tạo ca thi và phòng thi trước khi export');
          }


          this.notifi.isProcessing(false);
        }, error: (e) => {
          this.notifi.isProcessing(false);
          this.notifi.toastError('Load dữ liệu không thành công');
        }
      }
    )
  }

  btnExportExcelV3(hoidong: ThptHoiDong) {

    this.notifi.isProcessing(true);

    this.hoiDongThiSinhService.getDataByHoiDongIdNotPage(hoidong.id).subscribe({
      next: (data) => {

        const dataParam = [];
        data.sort((a, b) => this.extractNumberFromString(a['sobaodanh'], hoidong.tiento_sobaodanh) - this.extractNumberFromString(b['sobaodanh'], hoidong.tiento_sobaodanh)).forEach((m, index) => {
          const item = {};
          const thisinh = m['thisinh'];
          item['__index_table'] = index + 1;
          item['__thisinh_id'] = m.thisinh_id;
          item['__ma_dk'] = m['sobaodanh'];
          item['__hoten'] = thisinh ? this.helperService.capitalizeAfterSpace(thisinh['hoten']) : '';
          item['__ngaysinh'] = thisinh ? this.repplaceNgaysinh(thisinh['ngaysinh']) : '';
          item['__gioitinh'] = thisinh && thisinh['gioitinh'] === 'nu' ? 'Nữ' : 'Nam';
          item['__cccd_so'] = thisinh ? thisinh['cccd_so'] : '';
          item['__email'] = thisinh ? thisinh['email'] : '';
          item['__phone'] = thisinh ? thisinh['phone'] : '';

          this.dmMon.map(a => {
            item['__mon_' + a.kyhieu] = m.monthi_ids.find(f => f === a.id) ? a.tenmon : '';
          })

          this.dmMon.map(a => {
            const mon = m.monthi_ids.find(mon_id => mon_id === a.id)
            item['__sbd_' + a.kyhieu] = mon ? m['sobaodanh'] : '';
            item['__cathi_' + a.kyhieu] = mon ? m['ca_' + a.kyhieu.toLowerCase()] : '';
            const cathi = m['ca_' + a.kyhieu.toLowerCase()];
            item['__diadiem_' + a.kyhieu] = mon ? 'Trung tâm Khảo thí và Quản lý chất lượng – ĐHTN, Phường Tân Thịnh – Thành phố Thái Nguyên' : '';
            item['__phongthi_' + a.kyhieu] = mon ? m['phongthi'] : '';
            item['__timeStart_' + a.kyhieu] = mon ? this.thptLichthi.find(f => f.id === cathi)['gio_goivao_phongthi'].replace(' giờ ', 'g') + ' ngày ' + hoidong['__ngaythi'] : '';
          })
          dataParam.push(item);
        })

        this.expostExcelPhongthiThisinhService.exportExcelOnlySheet1(dataParam, this.columns, hoidong.ten_hoidong);
        this.notifi.isProcessing(false);
      }, error: (e) => {
        this.notifi.isProcessing(false);
        this.notifi.toastError('Load dữ liệu thành công')
      }
    })
  }

  covernumber(input: number) {
    return input < 10 ? '0' + input : input.toString();
  }

  btnExportExcel(item: ThptHoiDong) {
    forkJoin(
      this.hoiDongThiSinhService.getDataByHoiDongIdNotPage(item.id),
      this.thptHoidongCathiService.getDataUnlimitByhoidongId(item.id).pipe(
        concatMap(cathi => {
          const cathiIds = cathi.map(m => m.id);
          return forkJoin(
            of(cathi), this.thptHoidongPhongthiService.getDataByHoidongVaCathiIds(item.id, cathiIds).pipe(concatMap(prj => {
              const phongthi_ids = prj.map(a => a.id);
              return forkJoin<[ThptHoiDongPhongThi[], ThptPhongThiMonThi[]]>(
                of(prj),
                this.thptPhongthiMonthiService.getDataByphongthiIds(phongthi_ids)
              );
            })));
        }))
    ).subscribe(
      {
        next: (data) => {
          const dataThisinh = data[0];
          const dataCathi: ThptCathi[] = data[1][0];
          const dataPhongthi: ThptHoiDongPhongThi[] = data[1][1][0].map(m => {
            const cathi = dataCathi.find(f => f.id === m.cathi_id);
            m['__cathi_Covented'] = cathi ? cathi.cathi : '';
            m['__ngaythi'] = cathi ? this.helperService.formatSQLToDateDMY(new Date(cathi.ngaythi)) : '';
            m['__time_start'] = cathi ? (new Date(cathi.time_start).getHours() + ':' + this.covernumber(new Date(cathi.time_start).getMinutes())) : '';
            return m;
          });
          const dataMonthi: ThptPhongThiMonThi[] = data[1][1][1].filter(f => f.thisinh_ids.length !== 0).sort((a, b) => a.phongthi_id - b.phongthi_id).map(m => {

            m['__phongthi'] = dataPhongthi.find(f => f.id === m.phongthi_id);
            m['__thisinh_sapxep'] = m.thisinh_ids.map(a => m['thisinh'].find(b => b.id === a));
            return m;
          });

          if (dataThisinh.length > 0 && dataCathi.length !== 0 && dataPhongthi.length !== 0 && dataMonthi.length !== 0) {
            const thisinhExport: any[] = [];

            dataThisinh.forEach((m, index) => {
              const item = {};
              const thisinh = m['thisinh'];
              item['__indexTable'] = index + 1;
              item['__thisinh_id'] = thisinh ? thisinh['id'] : '';
              item['__madk'] = thisinh ? 'TNU' + thisinh['id'] : '';
              item['__hoten'] = thisinh ? thisinh['hoten'] : '';
              item['__ngaysinh'] = thisinh ? thisinh['ngaysinh'] : '';
              item['__gioitinh'] = thisinh && thisinh['gioitinh'] === 'nam' ? 'Nam' : (thisinh && thisinh['gioitinh'] === 'nu' ? 'Nữ' : '');
              item['__cccd'] = thisinh ? thisinh['cccd_so'] : '';
              item['__email'] = thisinh ? thisinh['email'] : '';
              item['__phone'] = thisinh ? thisinh['phone'] : '';

              this.dmMon.map(a => {
                item['__mon_' + a.kyhieu] = m.monthi_ids.find(f => f === a.id) ? a.tenmon : '';
              })
              this.dmMon.map(a => {
                const monthi = dataMonthi.find(f => f.monthi_id === a.id && f.thisinh_ids.find(b => b === thisinh['id']));
                const checkphongthi = monthi ? monthi['__phongthi'] : '';
                item['__sbd_' + a.kyhieu] = monthi ? 'TNU' + thisinh['id'] : '';
                item['__cathi_' + a.kyhieu] = checkphongthi ? checkphongthi['__cathi_Covented'] : '';
                item['__diadiem_' + a.kyhieu] = checkphongthi ? 'Trung tâm Khảo thí và Quản lý chất lượng – ĐHTN, Phường Tân Thịnh – Thành phố Thái Nguyên' : '';
                item['__phongthi_' + a.kyhieu] = checkphongthi ? checkphongthi.ten_phongthi : '';
                item['__timeStart_' + a.kyhieu] = checkphongthi ? monthi.timeStart.replace(':', 'g') + ' ngày ' + checkphongthi['__ngaythi'] : '';
              })

              thisinhExport.push(item);
            })

            const dataPhongthiExport: any[] = [];
            this.dmMon.forEach(mon => {
              const phongthiMonthi = dataMonthi.filter(f => f.monthi_id === mon.id)

              if (phongthiMonthi.length > 0) {
                phongthiMonthi.forEach(a => {
                  const tungmon: any = {};
                  const phongthi = a['__phongthi'];
                  tungmon['cathi'] = phongthi ? phongthi['__cathi_Covented'] : '';
                  tungmon['phong'] = phongthi ? phongthi.ten_phongthi : '';
                  this.dmMon.forEach(dm => {
                    tungmon['__monthi_' + dm.kyhieu] = a.monthi_id === dm.id ? dm.tenmon : ''
                  })

                  tungmon['__timeStart'] = phongthi ? a.timeStart.replace(':', 'g') + ' ngày ' + phongthi['__ngaythi'] : '';
                  tungmon['diadiem'] = phongthi ? 'Trung tâm Khảo thí và Quản lý chất lượng – ĐHTN, Phường Tân Thịnh – Thành phố Thái Nguyên' : '';
                  dataPhongthiExport.push(tungmon)
                })
              }
            })

            this.expostExcelPhongthiThisinhService.exportExcel(thisinhExport, this.columns, item.ten_hoidong, dataPhongthiExport, this.columnSheet2);
          } else {
            this.notifi.toastError('Người dùng chưa tạo phòng thi, vui lòng tạo phòng thi !')
          }

        }, error: (e) => {
          this.notifi.isProcessing(false);
          this.notifi.toastError('load Dữ liệu không thành công');
        }
      }
    )
  }

  repplaceNgaysinh(text: string) {
    const parts = text.split('/');
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];

    // Chuyển đổi sang định dạng mới
    return `${year}-${month}-${day}`;
  }

  //--------------------------
  btnThiSinhInHoiDong(item: ThptHoiDong) {
    this.notifi.isProcessing(false);
    this.hoidong_id = item.id;
    this.kehoach_id_param = item.kehoach_id;
    this.notifi.openSideNavigationMenu({
      template: this.thiSinhInPhongThi,
      size: this.sizeFullWidth,
      offsetTop: '0px'
    });
  }

  extractNumberFromString(inputString: string, tiento: string) {
    const prefix = tiento;
    const startIndex = inputString.indexOf(prefix);
    return startIndex !== -1 ? parseInt(inputString.substring(startIndex + prefix.length), 10) : NaN;
  }

  paginate({page}: NgPaginateEvent) {
    this.page = page + 1;

    this.getDataHoiDong(this.page);
  }

  countOccurrences(number, data) {
    return data.reduce((acc, item) => acc + (item.monthi_ids.includes(number) ? 1 : 0), 0);
  }

  btnViewThongke(hoidong: ThptHoiDong) {
    this.hoidong_id = hoidong.id;
    this.hoidong_select = hoidong;
    this.notifi.openSideNavigationMenu({
      template: this.viewThongKe,
      size: this.sizeFullWidth,
      offsetTop: '0px'
    });

  }

  btnXuattuidongphieu(hoidong: ThptHoiDong) {
    this.hoidong_id = hoidong.id;
    this.notifi.isProcessing(true);
    this.isLoading = true;

    forkJoin(this.hoiDongThiSinhService.getDataPhongthiandMonthi_idsByHoidong_id(hoidong.id), this.hoiDongThiSinhService.getDataPhongthiOnlyByHoidongId(hoidong.id)).subscribe({
      next: ([data, phongthi]) => {
        phongthi.map(m => {
          m['hoidong'] = hoidong;
          const dsthisinh = data.filter(f => f['phongthi'] === m['phongthi']);

          const cathis = [];
          for (let i = 0; i < 7; i++) {
            const item = {
            id: i + 1,
            total_thisinh: dsthisinh.length
          }
          item['_total_ca_th'] = dsthisinh.filter(thisinh => thisinh['ca_th'] === i + 1) ? dsthisinh.filter(thisinh => thisinh['ca_th'] === i + 1).length : 0;
          item['_total_ca_vl'] = dsthisinh.filter(thisinh => thisinh['ca_vl'] === i + 1) ? dsthisinh.filter(thisinh => thisinh['ca_vl'] === i + 1).length : 0;
          item['_total_ca_hh'] = dsthisinh.filter(thisinh => thisinh['ca_hh'] === i + 1) ? dsthisinh.filter(thisinh => thisinh['ca_hh'] === i + 1).length : 0;
          item['_total_ca_sh'] = dsthisinh.filter(thisinh => thisinh['ca_sh'] === i + 1) ? dsthisinh.filter(thisinh => thisinh['ca_sh'] === i + 1).length : 0;
          item['_total_ca_ls'] = dsthisinh.filter(thisinh => thisinh['ca_ls'] === i + 1) ? dsthisinh.filter(thisinh => thisinh['ca_ls'] === i + 1).length : 0;
          item['_total_ca_dl'] = dsthisinh.filter(thisinh => thisinh['ca_dl'] === i + 1) ? dsthisinh.filter(thisinh => thisinh['ca_dl'] === i + 1).length : 0;
          item['_total_ca_ta'] = dsthisinh.filter(thisinh => thisinh['ca_ta'] === i + 1) ? dsthisinh.filter(thisinh => thisinh['ca_ta'] === i + 1).length : 0;
          item['_total_mon_incathi'] =item['_total_ca_th']+ item['_total_ca_vl']+ item['_total_ca_hh']+ item['_total_ca_sh']+ item['_total_ca_ls']+ item['_total_ca_dl']+ item['_total_ca_ta'];
          cathis.push(item);

        }
          m['cathis'] = cathis.filter(cathi =>cathi['_total_mon_incathi'] >0);
          return m
        })

        this.htmlToPdfService.exportTuiDungPhieuByHTMLtoWord(phongthi, hoidong.ten_hoidong + '(Túi đựng phiếu)');
        this.notifi.isProcessing(false);
        this.isLoading = false;

      }, error: () => {
        this.notifi.isProcessing(false);
        this.isLoading = false;
        this.notifi.toastError('Load dữ liệu không thành công ');
      }
    })
  }

  async btnLockData(hoidong:ThptHoiDong){
    const button = await this.notifi.confirmRounded('Thao tác nay sẽ khóa dữ liệu của thí sinh ', 'XÁC NHẬN KHÓA DỮ LIỆU ', [BUTTON_NO, BUTTON_YES]);
    if (button.name === BUTTON_YES.name) {
      this.notifi.isProcessing(true);
        this.hoiDongService.update(hoidong.id, {lock:1}).subscribe({
          next:()=> {
            this.notifi.isProcessing(false);
            this.notifi.toastSuccess('Khóa hội đồng thành công');
            this.hoiDongThiSinhService.getDataThisinhBySelectAndHoidongId(hoidong.id).pipe(switchMap(prj=>{

              this.notifi.loadingAnimationV2({process: {percent: 0}});
              const step: number = 100 / prj.length;
              return this.updateLockthisinhs(prj,step,0)
            })).subscribe({
              next:(data)=>{
                this.notifi.isProcessing(false);
                this.notifi.toastSuccess('Khóa dữ liệu thí sinh thành công');
                this.loadData();
              },error:()=>{
                this.notifi.isProcessing(false);
                this.notifi.toastError('Khóa dữ liệu thí sinh chưa thành công ');
              }
            })
          },
          error:()=>{
            this.notifi.isProcessing(false);
            this.notifi.toastError('Khóa hội đồng không thành công ');
          }
        })
    }
  }

  private updateLockthisinhs(list, step: number, percent: number){
    try{
      const index: number = list.findIndex(i => !i['created']);
      if (index !== -1) {
        return this.thisinhInfo.update(list[index]['thisinh_id'], {lock:1}).pipe(switchMap(() => {
          list[index]['created'] = true;
          const newPercent: number = percent + step;
          this.notifi.loadingAnimationV2({process: {percent: newPercent}});
          return this.updateLockthisinhs(list, step, newPercent);
        }))
      } else {
        this.notifi.disableLoadingAnimationV2();
        return of('complete');
      }
    }catch (e){
      return of(list);
    }
  }

}
