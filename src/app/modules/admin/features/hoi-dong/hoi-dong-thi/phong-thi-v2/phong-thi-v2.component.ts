import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {Paginator} from "primeng/paginator";
import {DmMon} from "@shared/models/danh-muc";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ThptCathi, ThptHoidongCathiService} from "@shared/services/thpt-hoidong-cathi.service";
import {ThptHoiDongPhongThi, ThptHoiDongThiSinh} from "@shared/models/thpt-model";
import {ThiSinhInfo} from "@shared/models/thi-sinh";
import {ThptPhongThiMonThi, ThptPhongthiMonthiService} from "@shared/services/thpt-phongthi-monthi.service";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {NotificationService} from "@core/services/notification.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {DanhMucPhongThiService, DmPhongThi} from "@shared/services/danh-muc-phong-thi.service";
import {ThptHoidongPhongthiService} from "@shared/services/thpt-hoidong-phongthi.service";
import {ThptHoidongThisinhService} from "@shared/services/thpt-hoidong-thisinh.service";
import {HelperService} from "@core/services/helper.service";
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {ThisinhInfoService} from "@shared/services/thisinh-info.service";
import {SenderEmailService} from "@shared/services/sender-email.service";
import {HtmlToPdfService} from "@shared/services/html-to-pdf.service";
import {FileService} from "@core/services/file.service";
import {ThptHoiDong, ThptHoiDongService} from "@shared/services/thpt-hoi-dong.service";
import {forkJoin, from, Observable, of, switchMap} from "rxjs";
import {WAITING_POPUP} from "@shared/utils/syscat";
import {catchError, delay, map} from "rxjs/operators";
import {BUTTON_NO, BUTTON_YES} from "@core/models/buttons";
import {ExportExcelService} from "@shared/services/export-excel.service";
import {
  ExpostExcelPhongthiThisinhService,
  PhongthiExportExcel
} from "@shared/services/expost-excel-phongthi-thisinh.service";

interface TestRoomPreSet {
  phongso: number;
  soluong: number;
  soluong_thucte: number;
  thisinh_ids: number[];
  created: boolean;
}


interface FormatPhongthiBythisinh {
  index: number;
  monthi: string;
  phong: string;
  ngaythi: string;
  time_start: string;
}

interface FormatthisinhSendEmail {
  hoten: string;
  email: string;
  ngaysinh: string;
  gioitinh: string;
  thuongtru: string;
  dantoc: string;
  cccd_so: string;
  phongthi: FormatPhongthiBythisinh[];
  sobaodanh: string;
  noisinh: string;
  created: boolean;
}

@Component({
  selector: 'app-phong-thi-v2',
  templateUrl: './phong-thi-v2.component.html',
  styleUrls: ['./phong-thi-v2.component.css']
})
export class PhongThiV2Component implements OnInit, OnChanges {
  @Input() hoidong_id: number;
  @Input() kehoach_id: number;
  @ViewChild(Paginator) paginator: Paginator;
  @ViewChild('templateWaiting') templateWaiting: ElementRef;

  dmMon: DmMon[];
  switchPage: 'CATHI' | 'PHONGTHI' | 'CHITIET_PHONGTHI' = 'CATHI';
  formSave: FormGroup;
  dataPhongThi: { phongso: number, soluong: number }[] = [];
  hoidong: ThptHoiDong;
  // ---------------------- Thí sinh hoidong-----------------
  dataThisinhInHoidong: ThptHoiDongThiSinh[];

  // ---------------------- Ca thi --------------------------
  isLoading: boolean = true;
  typeMonCaThi: 'TOAN' | 'CACMON' = "TOAN";
  dataCaThi: ThptCathi[] = [];
  typeAdd: 'ADD' | 'UPDATE' = "ADD";
  formCathi: FormGroup;
  caThiSelect: ThptCathi;
  //---------------------- Phong thi-------------------------//
  loadInitFail = false;

  dsPhongThi: ThptHoiDongPhongThi[] = [];
  phongthi_select: ThptHoiDongPhongThi;
  dsThisinhInMonThi: ThiSinhInfo[] = [];
  monthi_Phongthi_select: ThptPhongThiMonThi;


  constructor(
    private themeSettingsService: ThemeSettingsService,
    private notifi: NotificationService,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private danhMucPhongThiService: DanhMucPhongThiService,
    private hoidongPhongThiService: ThptHoidongPhongthiService,
    private hoidongThissinhService: ThptHoidongThisinhService,
    private thptHoidongCathiService: ThptHoidongCathiService,
    private helperService: HelperService,
    private dmMonthiService: DanhMucMonService,
    private thisinhInfoService: ThisinhInfoService,
    private senderEmailService: SenderEmailService,
    private htmlToPdfService: HtmlToPdfService,
    private fileService: FileService,
    private thptHoiDongService: ThptHoiDongService,
    private expostExcelPhongthiThisinhService:ExpostExcelPhongthiThisinhService
  ) {
    this.formCathi = this.fb.group({
      hoidong_id: [this.hoidong_id, Validators.required],
      cathi: ['Ca 1', Validators.required],
      ngaythi: ['', Validators.required],
      time_start: ['', Validators.required],
      mota: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.hoidong_id) {
      this.switchPage = 'CATHI';
      this.resetFormCathi();
      this.loadInit();
    }
  }


  ngOnInit(): void {
    if (this.hoidong_id) {
      this.switchPage = "CATHI";
      this.resetFormCathi();
      this.loadInit();
    }
  }

  loadInit() {
    this.loadDataDm()
    this.loadDataCathi()
  }

  loadDataCathi() {
    this.isLoading = true;
    forkJoin<[DmMon[], ThptCathi[], ThptHoiDong]>(
      this.dmMonthiService.getDataUnlimit(),
      this.thptHoidongCathiService.getDataUnlimitByhoidongId(this.hoidong_id),
      this.thptHoiDongService.getHoidongonly(this.hoidong_id)
    ).subscribe({
      next: ([mon, data, hoidong]) => {
        this.hoidong = hoidong;
        this.dmMon = mon;
        this.dataCaThi = data.map((m, index) => {
          m['_indexTable'] = index + 1;
          m['__ngaythi_coverted'] = this.strToTime(m.ngaythi);
          m['__cathiCoverted'] = `<b>${m.cathi}</b><br>` + m.mota;
          m['__monthi_covered'] = this.dmMon ? m.mon_ids.map(f => this.dmMon.find(a => a.id === f)) : [];
          m['__time_start_coverted'] = m.time_start ? (this.covernumber(new Date(m.time_start).getHours()) + ':' + this.covernumber(new Date(m.time_start).getMinutes())) : '';
          return m;
        });
        this.isLoading = false;
        this.notifi.isProcessing(false);
      }, error: () => {
        this.isLoading = false;

        this.notifi.isProcessing(false);
        this.notifi.toastError('Load dữ liệu ca thi không thành công ')
      }
    })
  }

  // get f(): { [key: string]: AbstractControl<any> } {
  //   return this.formPhongthi.controls;
  // }
  submitFormCathi() {

    if (this.formCathi.valid) {

      const timetoServer = this.helperService.strToSQLDate(this.formCathi.value.ngaythi);
      this.formCathi.value.ngaythi = timetoServer;
      const observer$: Observable<any> = this.typeAdd === 'ADD' ? this.thptHoidongCathiService.create(this.formCathi.value) : this.thptHoidongCathiService.update(this.caThiSelect.id, this.formCathi.value);
      if (this.typeAdd === 'UPDATE') {
        observer$.subscribe({
          next: () => {
            this.loadDataCathi();
            this.resetFormCathi();
            this.notifi.toastSuccess('Thao tác thành công', 'Thông báo');
          },
          error: () => this.notifi.toastError('Thao tác thất bại', 'Thông báo')
        });
      } else {
        this.submitDataCathiToThiSinh();
      }
    } else {
      this.notifi.toastWarning('Vui lòng nhập đủ thông tin');
    }
  }

  resetFormCathi() {
    this.typeAdd = "ADD";
    this.formCathi.reset({
      hoidong_id: this.hoidong_id,
      cathi: '',
      ngaythi: '',
      mota: '',
      time_start: ''
    })
  }

  btnUpDataCathi(item: ThptCathi) {
    this.typeAdd = "UPDATE";
    this.caThiSelect = item;

    this.formCathi.reset({
      hoidong_id: this.hoidong_id,
      cathi: item.cathi,
      ngaythi: item.ngaythi ? new Date(item.ngaythi) : null,
      time_start: item.time_start ? item.time_start : null,
      mota: item.mota,
    })
  }

  async btnDeleteCathi(item) {
    const confirm = await this.notifi.confirmDelete();
    if (confirm) {
      this.thptHoidongCathiService.delete(item.id).subscribe({
        next: () => {
          this.dataCaThi = this.dataCaThi.filter(f => f.id !== item.id);
          this.notifi.isProcessing(false);
          this.notifi.toastSuccess('Thao tác thành công');
        }, error: () => {
          this.notifi.isProcessing(false);
          this.notifi.toastError('Thao tác không thành công');
        }
      })
    }
  }

  strToTime(input: string): string {
    const date = input ? new Date(input) : null;
    let result = '';
    if (date) {
      result += [date.getDate().toString().padStart(2, '0'), (date.getMonth() + 1).toString().padStart(2, '0'), date.getFullYear().toString()].join('/');
      // result += ' ' + [date.getHours().toString().padStart(2, '0'), date.getMinutes().toString().padStart(2, '0')].join(':');
    }
    return result;
  }

  // ------------------- load data danh muc và  thisinh ------------------
  loadDataDm() {
    this.notifi.isProcessing(true);

    forkJoin<[DmPhongThi[], ThptHoiDongThiSinh[]]>(
      this.danhMucPhongThiService.getDataUnlimit(),
      this.hoidongThissinhService.getDataByHoiDongIdNotPage(this.hoidong_id),
    ).subscribe({
      next: ([dmPhongthi, data]) => {
        this.dataPhongThi = this.convertDmPhongThi(dmPhongthi);

        const dataThisinhHoidong = data ? data.map(m => {

          m['__monthi_lenght'] = m.monthi_ids.length;
          return m;
        }) : [];
        this.dataThisinhInHoidong = this.sortByLargerNumber(dataThisinhHoidong);
        this.notifi.isProcessing(false);
      },
      error: () => {
        this.notifi.isProcessing(false);
      }
    })

  }

  sortByLargerNumber(arr: ThptHoiDongThiSinh[]) {
    if (arr.length <= 0) {
      return arr;
    } else {
      const sortedByFirstLetter = arr.sort((a, b) => {
        return b['__monthi_lenght'] - a['__monthi_lenght'];
      });
      return sortedByFirstLetter;
    }

  }

  convertDmPhongThi(data: DmPhongThi[]) {
    let result: any[] = [];
    for (let item of data) {
      let start = item.fromAt;
      let end = item.toAt;
      let soluong = item.soluong;
      for (let i = start; i <= end; i++) {
        result.push({soluong: soluong, phongso: i});
      }
    }
    return result;
  }

  cathiTypeMonthi(type: number) {
    if (type === 1) {
      this.typeMonCaThi = 'TOAN'
    }
    if (type === 0) {
      this.typeMonCaThi = "CACMON";
    }
  }

  submitDataCathiToThiSinh() {
    this.notifi.isProcessing(true);

    if (this.typeMonCaThi === 'TOAN') {
      const dsThisinhParram = [];
      this.dataThisinhInHoidong.forEach(m => {
        if (m.monthi_ids.find(f => f === 1)) {
          dsThisinhParram.push(m);
        }
      })
      const newPhongs = this.setUptestRoom(this.dataPhongThi, dsThisinhParram);

      const step: number = 100 / newPhongs.length;
      const objectCathi = {
        hoidong_id: this.hoidong_id,
        cathi: this.formCathi.value.cathi,
        ngaythi: this.helperService.strToSQLDate(this.formCathi.value.ngaythi),
        mota: '',
        time_start: this.formCathi.value.time_start,
        mon_ids: [1]
      }

      this.thptHoidongCathiService.create(objectCathi).pipe(switchMap(id => {
        return this.createTestRoomControl(newPhongs, id, step, 0)
      })).subscribe({
        next: (data) => {
          this.notifi.isProcessing(false);
          this.loadDataCathi();
        }, error: (e) => {
          this.notifi.isProcessing(false);
          this.notifi.toastError('Tạo mới không thành công');
          this.loadDataCathi();
        }
      })
    } else {
      const dsThisinhParram = [];
      this.dataThisinhInHoidong.forEach(m => {
        if (m.monthi_ids.find(f => f !== 1) && m.monthi_ids.length > 1) {
          dsThisinhParram.push(m);
        }
      })
      const newPhongs = this.setUptestRoom(this.dataPhongThi, dsThisinhParram);
      const step: number = 100 / newPhongs.length;
      const objectCathi = {
        hoidong_id: this.hoidong_id,
        cathi: this.formCathi.value.cathi,
        ngaythi: this.helperService.strToSQLDate(this.formCathi.value.ngaythi),
        mota: '',
        time_start: this.formCathi.value.time_start,
        mon_ids: this.dmMon.filter(f => f.id !== 1).map(m => parseInt(String(m.id)))
      }

      this.thptHoidongCathiService.create(objectCathi).pipe(switchMap(id => {
        return this.createTestRoomControl(newPhongs, id, step, 0)
      })).subscribe({
        next: (data) => {
          this.notifi.isProcessing(false);
          this.loadDataCathi();
        }, error: (e) => {
          this.notifi.isProcessing(false);

          this.notifi.toastError('Tạo mới không thành công');
          this.loadDataCathi();
        }
      })

    }
  }

  setUptestRoom(dataphongthi: { phongso: number, soluong }[], dsthisinh: ThptHoiDongThiSinh[]) {
    const phongCanthiet: TestRoomPreSet[] = dataphongthi.map(phong => {

      return {phongso: phong.phongso, soluong: phong.soluong, thisinh_ids: [], soluong_thucte: 0, created: false}
    });
    let indexRoom = 0;
    for (let ts = 0; ts < dsthisinh.length; ts++) {
      const ts_id = dsthisinh[ts].thisinh_id;
      const dk1 = phongCanthiet[indexRoom].soluong
      const dk2 = phongCanthiet[indexRoom].thisinh_ids.length;
      if (dk2 >= dk1) {
        indexRoom++;
      }
      phongCanthiet[indexRoom].thisinh_ids.push(ts_id);
      phongCanthiet[indexRoom].soluong_thucte += 1;
    }
    return phongCanthiet.filter(f => f.soluong_thucte !== 0);
  }

  private createTestRoomControl(list: TestRoomPreSet[], cathi_id, step: number, percent: number): Observable<any> {
    const index: number = list.findIndex(i => !i.created);
    if (index !== -1) {
      return this.createTestRoom(list[index], cathi_id).pipe(switchMap(() => {
        list[index].created = true;
        const newPercent: number = percent + step;
        this.notifi.loadingAnimationV2({process: {percent: newPercent}});
        return this.createTestRoomControl(list, cathi_id, step, newPercent);
      }))
    } else {
      this.notifi.disableLoadingAnimationV2();
      return of('complete');
    }
  }

  private createTestRoom(info: TestRoomPreSet, cathi_id: number): Observable<number> {
    const phongsoParam = info.phongso < 10 ? '00' + info.phongso : info.phongso.toString() ;
    const phongcreate = {
      ten_phongthi:  info.phongso,
      ma_phongthi: 'P' + phongsoParam + '.' + this.hoidong_id + '.' + this.kehoach_id,
      hoidong_id: this.hoidong_id,
      kehoach_id: this.kehoach_id,
      cathi_id: cathi_id,
      thisinh_ids: info.thisinh_ids,
      soluong_toida: info.soluong
    };
    return this.hoidongPhongThiService.create(phongcreate)
  }

  // --------------------Thao tác phòng thi--------------------------

  btnExportAlbum(cathi: ThptCathi) {
    this.modalService.open(this.templateWaiting, WAITING_POPUP);
    const fileName = cathi.cathi + '( ' + this.hoidong.ten_hoidong + ' )' + ' - Danh sách thí sinh';
    const cathi_id = cathi.id;
    this.notifi.isProcessing(true);
    this.hoidongPhongThiService.getDataByHoidongVaCathiId(this.hoidong_id, cathi_id).pipe(switchMap(m => {
      return this.loadphongthiWidththisinh(m)
    })).subscribe(
      {
        next: (data) => {

          const dataMap = data.map((m) => {
            m['__ten_cathi'] = cathi.cathi;
            m['__ngaythi'] = this.strToTime(cathi.ngaythi);
            return m;
          })
          if (data.length > 0) {
            this.htmlToPdfService.exportHtmlToWord(dataMap, fileName);
            this.modalService.dismissAll();

          } else {
            this.modalService.dismissAll();
            this.notifi.toastError('Chưa có dữ liệu thí sinh !');
          }

          this.notifi.isProcessing(false);
          this.modalService.dismissAll()
        },
        error: (e) => {
          this.notifi.isProcessing(false);
          this.notifi.toastError('Load dữ liệu không thàng công');
          this.modalService.dismissAll()

        }
      }
    )
  }


  private loadphongthiWidththisinh(prj: ThptHoiDongPhongThi[]): Observable<ThptHoiDongPhongThi[]> {
    const requests$: Observable<any>[] = [];
    prj.forEach((r, index) => {
      const ids = r.thisinh_ids;
      const request$ =
        this.thisinhInfoService.getDataBythisinhIds(ids).pipe(switchMap((id) => {
            return this.loadThiSinhAvatarProcess(id).pipe(map(m => {
              r['__thisinh_in_phong'] = m;
              return r;
            }));
          }),
          delay(index * 150),
          catchError(error => {
            console.error(error);
            return of(null);
          })
        );

      requests$.push(request$);
    });
    return forkJoin(requests$);
  }

  private loadThiSinhAvatarProcess(info: ThiSinhInfo[]): Observable<ThiSinhInfo[]> {
    try {
      const index: number = info.findIndex(t => !t['_avatarLoaded']);

      if (index !== -1) {
        return this.fileService.getFileAsBlobByName(info[index].anh_chandung[0].id.toString()).pipe(switchMap(blob => {
          info[index]['_avatarLoaded'] = true;
          return forkJoin<[string, ThiSinhInfo[]]>(
            from(this.fileService.blobToBase64(blob)),
            this.loadThiSinhAvatarProcess(info)
          ).pipe(map(([src, loadedData]) => {
            loadedData[index]['_avatarSrc'] = src ? src.replace('data:application/octet-stream;base64', 'data:image/jpeg;base64') : src;
            return loadedData;
          }))
        }))
      } else {
        return of(info)
      }
    } catch (e) {
      return of(info)
    }
  }

  btnViewSitePhongthi(item: ThptCathi) {
    this.switchPage = "PHONGTHI";
    this.caThiSelect = item;
    this.loadDataPhongthi();
    // this.resetFormPhongthi();
  }

  // resetFormPhongthi() {
  //   // this.formPhongthi.reset({
  //   //   hoidong_id: this.hoidong_id,
  //   // })
  // }

  loadDataPhongthi() {
    this.notifi.isProcessing(true)
    this.isLoading = true;
    this.hoidongPhongThiService.getDataByKehoachIdAndCathiId(this.hoidong_id, this.caThiSelect.id).subscribe({
      next: (data) => {
        this.dsPhongThi = data?.filter(Boolean).map((m, index) => {
          m['__index_table'] = index + 1;
          m['__soluong_thisinh_converted'] = m.thisinh_ids.length + '/' + m.soluong_toida;
          return m;
        });
        this.notifi.isProcessing(false);
        this.isLoading = false;
      },
      error: (e) => {
        this.notifi.isProcessing(false);
        this.isLoading = false;
      }
    })
  }

  btnReturnCathi() {
    this.switchPage = "CATHI";
    this.resetFormCathi()
    // this.resetFormPhongthi()
  }

  btnViewInfoByPhongThi(item: ThptHoiDongPhongThi) {
    this.switchPage = "CHITIET_PHONGTHI"
    const thisinh_ids = item.thisinh_ids;
    this.phongthi_select = item;
    this.notifi.isProcessing(true);
    this.thisinhInfoService.getDataBythisinhIds(thisinh_ids).subscribe({
      next: (data) => {
        this.phongthi_select.thisinh_ids.map(m => {
          return data.find(f => f.id === m);
        })

        this.dsThisinhInMonThi = data.map((m, index) => {
          m['__index_table'] = index + 1;
          return m;
        })
        this.notifi.isProcessing(false);
      },
      error: () => {
        this.notifi.isProcessing(false);
        this.notifi.toastError('load dữ liệu thí sinh không thành công ');
      }
    })
  }

  btnReturnPhongthi() {
    this.switchPage = "PHONGTHI"
  }

  async btnSendEmail() {
    const button = await this.notifi.confirmRounded('Gửi email thông báo lịch thi cho thí sinh ', 'XÁC NHẬN', [BUTTON_NO, BUTTON_YES]);
    if (button.name === BUTTON_YES.name) {
      const cathi_ids = this.dataCaThi.map(f => f.id);

      forkJoin<[ThptHoiDongThiSinh[], ThptHoiDongPhongThi[]]>(
        this.hoidongThissinhService.getDataByHoiDongIdNotPage(this.hoidong_id),
        this.hoidongPhongThiService.getDataByHoidongVaCathiIds(this.hoidong_id, cathi_ids)
      ).subscribe({
        next: ([hoidongThisinh, hoidongphongthi]) => {
          const dsthisinh = hoidongThisinh.map((m => {
            return m;
          }));
          const dsphongthi = hoidongphongthi.map(m => {
            m['cathi'] = this.dataCaThi.find(f => f.id === m.cathi_id);
            return m;
          });

          const thisinhExport = [];
          dsthisinh.forEach(thisinh => {
            const thisinhInfo = thisinh['thisinh'];
            const thisinhparam = {}
            const thisinh_phongthis = dsphongthi.filter(pt => pt.thisinh_ids.find(a => a === thisinh.thisinh_id));
            thisinhparam['id'] = thisinhInfo ? thisinhInfo['id'] : null;
            thisinhparam['hoten'] = thisinhInfo ? thisinhInfo['hoten'] : '';
            thisinhparam['email'] = thisinhInfo ? thisinhInfo['email'] : '';
            thisinhparam['ngaysinh'] = thisinhInfo ? thisinhInfo['ngaysinh'] : '';
            thisinhparam['gioitinh'] = thisinhInfo && thisinhInfo['giotinh'] === 'nu' ? 'Nữ' : 'Nam';
            thisinhparam['thuongtru'] = thisinhInfo && thisinhInfo['thuongtru_diachi'] ? thisinhInfo['thuongtru_diachi']['fullAddress'] : '';
            thisinhparam['dantoc'] = thisinhInfo ? thisinhInfo['dantoc'] : '';
            thisinhparam['cccd_so'] = thisinhInfo ? thisinhInfo['cccd_so'] : '';
            thisinhparam['noisinh'] = thisinhInfo ? thisinhInfo['noisinh'] : '';

            thisinhparam['sobaodanh'] = thisinhInfo ? 'TNU' + this.covertId(thisinhInfo['id']) : '';

            thisinhparam['phongthi'] = [];
            // const lichthi = []
            thisinh_phongthis.forEach((pt, index) => {
              const phongthi = {};
              phongthi['index'] = index + 1;
              phongthi['monthi'] = pt['cathi'] && pt['cathi']['mon_ids'].length === 1 ? pt['cathi']['mon_ids'].map(c => this.dmMon.find(n => n.id === c).tenmon).join(', ') : thisinh.monthi_ids.filter(mon => mon !== 1).map(c => this.dmMon.find(n => n.id === c).tenmon).join(', ');
              phongthi['phong'] = pt.ten_phongthi;
              phongthi['ngaythi'] = pt['cathi'] ? pt['cathi']['__ngaythi_coverted'] : '';
              phongthi['time_start'] = pt['cathi'] ? pt['cathi']['__time_start_coverted'].replace(':', 'g') : '';
              thisinhparam['phongthi'].push(phongthi);
            })
            thisinhparam['created'] = false;
            thisinhExport.push(thisinhparam);
          })

          this.notifi.isProcessing(true);
          if (this.dataCaThi.length > 0 && dsphongthi.length > 0) {
            const step: number = 100 / thisinhExport.length;
            this.notifi.loadingAnimationV2({process: {percent: 0}});
            this.emailCall(thisinhExport, step, 0).subscribe({
              next: (mess) => {
                this.notifi.toastSuccess('Gửi Email thông báo lịch thi thành công');
                this.notifi.isProcessing(false);
              }, error: (error) => {
                this.notifi.toastError('Gửi Email thông báo lịch thi không thành công');
                this.notifi.isProcessing(false);
                this.notifi.disableLoadingAnimationV2();
              }
            })
          } else {
            this.notifi.isProcessing(false);
            this.notifi.toastWarning('Chưa có dữ liệu phòng thi');
          }

        }, error: (e) => {
          this.notifi.toastError('Load dữ liêu không thành công');
        }
      })
    }
  }

  private emailCall(thisinhForm: FormatthisinhSendEmail[], step: number, percent: number) {
    const index: number = thisinhForm.findIndex(i => !i.created);
    if (index !== -1) {
      const item = thisinhForm[index];
      const email = item.email;

      let message = `

        <p style="font-size:20px;font-weight: 500"> Xin chào ${item['hoten']} !</p>

        <p>Hội đồng thi: TNU - Hội đồng thi Đại học Thái Nguyên</p>
        <p>Địa chỉ Điểm thi: Trung tâm Khảo thí và Quản lý chất lượng – ĐHTN,  Phường Tân Thịnh – Thành phố Thái Nguyên</p>
        <p style="font-weight:700;">THÔNG TIN THI SINH:</p>
        <table width="100%" style="border:0;">
            <tr>
                <td style="width:100px;">Họ và tên:</td>
                <td style="font-weight:600">${item.hoten}</td>
            </tr>
            <tr>
                <td style="width:100px;">Ngày sinh:</td>
                <td style="font-weight:600">${item.ngaysinh}</td>
            </tr>
            <tr>
                <td style="width:100px;">Giới tính:</td>
                <td style="font-weight:600">${item.gioitinh}</td>
            </tr>
            <tr>
                <td style="width:100px;">Dân tộc:</td>
                <td style="font-weight:600">${item.dantoc}</td>
            </tr>
            <tr>
                <td style="width:100px;">Nơi sinh:</td>
                <td style="font-weight:600">${item.noisinh}</td>
            </tr>
            <tr>
                <td style="width:100px;">Số CCCD:</td>
                <td style="font-weight:600">${item.cccd_so}</td>
            </tr>
            <tr>
                <td style="width:150px;">Hộ khẩu thường trú:</td>
                <td style="font-weight:600">${item.thuongtru}</td>
            </tr>


        </table>

        <p style="font-weight:700;" >LỊCH THI CÁ NHÂN:</p>

        <p><strong>Số báo danh :</strong> ${item.sobaodanh} </p>
        <table style=" border: 1px solid black;border-collapse: collapse;">
          <tr style="border: 1px solid black;border-collapse: collapse;">
            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="50px"><strong>STT</strong></th>

            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="100px"><strong>Môn thi</strong></th>
            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="100px"><strong>Phòng Thi</strong></th>
            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="100px"><strong>Ngày thi</strong></th>
            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="250px"><strong>Thời gian gọi thí sinh vào phòng thi</strong></th>
          </tr>
    `;
      item['phongthi'].forEach((phongthi, index) => {
        message += `
      <tr style="border: 1px solid black;border-collapse: collapse;">
        <td style="border: 1px solid black;border-collapse: collapse; text-align:center;">${phongthi['index']}</td>
        <td style="border: 1px solid black;border-collapse: collapse; text-align:left;">${phongthi['monthi']}</td>
        <td style="border: 1px solid black;border-collapse: collapse; text-align:center;">${phongthi['phong']}</td>
        <td style="border: 1px solid black;border-collapse: collapse; text-align:center;">${phongthi['ngaythi']}</td>
        <td style="border: 1px solid black;border-collapse: collapse; text-align:center;">${phongthi['time_start']}</td>
      </tr>
        `;
      })
      message += `</table> <p>Thí sinh đến tập trung trước 30 phút để hoàn thành thủ tục vào thi và tiến tiến hành vào thi !</p>`

      const emailsend: any = {
        title: 'THÔNG BÁO LỊCH THI V-SAT-TNU',
        to:email,
        message: message
      }
      return this.senderEmailService.sendEmail(emailsend).pipe(switchMap(() => {
        thisinhForm[index].created = true;
        const newPercent: number = percent + step;
        this.notifi.loadingAnimationV2({process: {percent: newPercent}});
        return this.emailCall(thisinhForm, step, newPercent);
      }))

    } else {
      this.notifi.disableLoadingAnimationV2();
      return of('complete');
    }
  }

  covernumber(input: number) {
    return input < 10 ? '0' + input : input.toString();
  }

//======================================================================================
  btnExportExcelRoom(cathi: ThptCathi) {

    this.notifi.isProcessing(true);
    this.hoidongPhongThiService.getDataByHoidongVaCathiId(this.hoidong_id, cathi.id).pipe(switchMap(prj => {
      return this.loadphongthiandThisinh(prj)
    })).subscribe({
      next: (data) => {
        const dataExport:PhongthiExportExcel[] = [];
        data.forEach(room=>{

          const thisinhParram = room.thisinh_ids.map((id,index)=>{
            const thisinhinfo = room['__thisinh_in_phong'].find(r=>r['id'] === id)? room['__thisinh_in_phong'].find(r=>r['id'] === id) : null;
            const item = {
                __index:index+1,
                sbd:thisinhinfo ? 'TNU' + (thisinhinfo.id <10 ? ('000'+thisinhinfo.id):(thisinhinfo.id >10 && thisinhinfo.id <100?('00'+thisinhinfo.id):(thisinhinfo.id>100 && thisinhinfo.id <1000 ? ('0'+thisinhinfo.id) : thisinhinfo.id.toString()) )) :'',
                hoten: thisinhinfo ? thisinhinfo['hoten'] : '',
                ngaysinh: thisinhinfo ? thisinhinfo['ngaysinh'] : '',
                gioitinh: thisinhinfo && thisinhinfo['gioitinh'] ==='nam' ? 'Nam' : 'Nữ',
                cccd_so: thisinhinfo ? thisinhinfo['cccd_so'] : '',
                ky:'',
            }
            return item
          })

          const roomParam :PhongthiExportExcel= {
            ten_phongthi    : room.ten_phongthi,
            cathi_name      : cathi.cathi,
            cathi_ngaythi   : cathi['__ngaythi_coverted'],
            time_ngaythi    : cathi['__time_start_coverted'],
            monthi          : cathi['__monthi_covered'].map(m=>m['tenmon']).join(', '),
            thisinh         : room['__thisinh_in_phong'] ? thisinhParram : room.thisinh_ids ,
          };
          dataExport.push(roomParam);
        })

        this.expostExcelPhongthiThisinhService.exportHoidongPhongthi(('Danh sách phòng thi Ca ' + cathi.cathi),this.thisinhs_column,dataExport)
        this.notifi.isProcessing(false);
      },
      error: (e) => {
        this.notifi.toastError('load dữ liệu phòng thi không thành công');
        this.notifi.isProcessing(false);

      }
    })
  }
  thisinhs_column= ['STT','SBD','Họ và tên thí sinh','Ngày sinh','Giới tính','Số CCCD','Thí sinh ký tên'];

  private loadphongthiandThisinh(prj: ThptHoiDongPhongThi[]): Observable<ThptHoiDongPhongThi[]> {
    const requests$: Observable<any>[] = [];
    prj.forEach((r, index) => {
      const ids = r.thisinh_ids;
      const request$ =
        this.thisinhInfoService.getDataBythisinhIdsandSelect(ids).pipe(map((id) => {
            r['__thisinh_in_phong'] = id;
            return r;
          }),
          delay(index * 100),
          catchError(error => {
            console.error(error);
            return of(null);
          })
        );
      requests$.push(request$);
    });
    return forkJoin(requests$);
  }

  covertId(iput:number){
    return iput<10? '000'+iput: (iput>10 && iput<100 ? '00'+ iput : (iput>100 && iput<1000 ? '0' +iput :iput));
  }
}
