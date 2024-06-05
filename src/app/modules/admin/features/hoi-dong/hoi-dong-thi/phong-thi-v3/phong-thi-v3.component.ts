import {Component, ElementRef, Input, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {Paginator} from "primeng/paginator";
import {DmMon} from "@shared/models/danh-muc";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ThptHoiDong, ThptHoiDongService} from "@shared/services/thpt-hoi-dong.service";
import {ThptHoiDongPhongThi, ThptHoiDongThiSinh} from "@shared/models/thpt-model";
import {ThptCathi, ThptHoidongCathiService} from "@shared/services/thpt-hoidong-cathi.service";
import {ThiSinhInfo} from "@shared/models/thi-sinh";
import {ThptPhongThiMonThi} from "@shared/services/thpt-phongthi-monthi.service";
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
import {
  ExpostExcelPhongthiThisinhService,
  PhongthiExportExcel
} from "@shared/services/expost-excel-phongthi-thisinh.service";
import {concatMap, forkJoin, from, Observable, of, switchMap} from "rxjs";
import {WAITING_POPUP} from "@shared/utils/syscat";
import {catchError, delay, map} from "rxjs/operators";
import {BUTTON_NO, BUTTON_YES} from "@core/models/buttons";
import {ThptPhongthiThiSinh, ThptPhongthiThisinhService} from "@shared/services/thpt-phongthi-thisinh.service";

interface CathiParam {
  id?: number;
  cathi: string;
  time_start: string;
  ngaythi: string;
  thisinh_ids: number[];

}

interface PhongthiParam {
  id?: number;
  ten_phongthi: string;
  soluong_toida: number;
  hoidong_id: number;
  kehoach_id: number;
  cathi_id: number;
  mota?: string;
  thisinh_ids: number[];
}

interface TestRoomPreSet {
  phongso: number;
  soluong: number;
  soluong_thucte: number;
  thisinh: ThptHoiDongThiSinh[];
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
  selector: 'app-phong-thi-v3',
  templateUrl: './phong-thi-v3.component.html',
  styleUrls: ['./phong-thi-v3.component.css']
})


export class PhongThiV3Component implements OnInit {
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
  arrayCathiCanthiet: { cathi: number, vitri: number }[] = [
    {cathi: 2, vitri: 1},
    {cathi: 3, vitri: 2},
    {cathi: 4, vitri: 3},
    {cathi: 5, vitri: 4},
    {cathi: 6, vitri: 5},
    {cathi: 7, vitri: 6},
  ]
  dataThisinhInHoidong: ThptHoiDongThiSinh[];

  // ---------------------- Ca thi --------------------------
  isLoading: boolean = true;
  typeMonCaThi: 'TOAN' | 'CACMON' = "TOAN";
  dataCaThi: ThptCathi[] = [];
  typeAdd: 'ADD' | 'UPDATE' = "ADD";
  formCathi: FormGroup;
  caThiSelect: ThptCathi;
  sendEmailLoadding: boolean = false;
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
    private expostExcelPhongthiThisinhService: ExpostExcelPhongthiThisinhService,
    private thptPhongthiThisinh: ThptPhongthiThisinhService
  ) {
    this.formCathi = this.fb.group({
      hoidong_id: [this.hoidong_id, Validators.required],
      cathi: [''],
      ngaythi: [''],
      time_start: [''],
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
          m['__ngaythi_coverted'] = m.ngaythi ? this.strToTime(m.ngaythi) : '';
          m['__cathiCoverted'] = `<b>${m.cathi}</b><br>` + m.mota;
          m['__monthi_covered'] = this.dmMon && m.mon_ids ? m.mon_ids.map(f => this.dmMon.find(a => a.id === f)) : [];
          m['__time_start_coverted'] = m.time_start ? this.helperService.formatSQLTime(new Date(m.time_start)) : '';
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
        this.dataThisinhInHoidong = this.sortByLargerNumber(dataThisinhHoidong).map(thisinh => {
          thisinh["monthi_ids"].sort((a, b) => a - b);
          return thisinh;
        });

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
      this.typeMonCaThi = "CACMON"
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
        cathi: '1',
        ngaythi: '',
        mota: '',
        time_start: '',
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
      const requests$: Observable<any>[] = [];
      this.notifi.isProcessing(true);
      this.arrayCathiCanthiet.sort((a, b) => a.cathi - b.cathi).forEach((soCathi, index) => {
        const dsThisinhParram = this.coverthisinhParramnotMath(this.dataThisinhInHoidong, soCathi)
        const newPhongs = this.setUptestRoom(this.dataPhongThi, dsThisinhParram);
        const step: number = 100 / newPhongs.length;
        const objectCathi = {
          hoidong_id: this.hoidong_id,
          cathi: (index + 2).toString(),
          ngaythi: '',
          mota: '',
          time_start: '',
        }

        const request$ = this.thptHoidongCathiService.create(objectCathi).pipe(switchMap(id => {
          return this.createTestRoomControl(newPhongs, id, step, 0)
        }))
        requests$.push(request$);
      })

      forkJoin(requests$).subscribe({
        next: (data) => {
          this.notifi.toastSuccess('Tạo ca thi thành công');
          this.notifi.isProcessing(false);
          this.loadDataCathi();
        },
        error: () => {
          this.notifi.toastError('Tạo mới không thành công');
          this.notifi.isProcessing(false);
          this.loadDataCathi();
        }
      })
    }
  }

  coverthisinhParramnotMath(thisinhInHoidong: ThptHoiDongThiSinh[], {vitri, cathi}: { cathi: number, vitri: number }) {

    const ids: number[] = [];
    const dsThisinhParram = [];
    thisinhInHoidong.forEach(monThi => {
      if (monThi.monthi_ids.find(f => f === 1)) {
        ids.push(monThi.id);

        const newM = JSON.parse(JSON.stringify(monThi))
        newM.monthi_ids = newM.monthi_ids.filter((_, index) => index > (vitri - 1));
        dsThisinhParram.push(newM);
      }
    })

    const DsThisinhNotToant = thisinhInHoidong.filter(thiSinh => !ids.includes(thiSinh.id)).map(monThi => {
      const m = JSON.parse(JSON.stringify(monThi))
      if (vitri > 1) {
        m.monthi_ids = m.monthi_ids.filter((_, i) => i > (vitri - 2));
      }
      return m;
    });
    return [].concat(dsThisinhParram.filter(f => f.monthi_ids.length > 0), DsThisinhNotToant.filter(f => f.monthi_ids.length > 0));
  }

  setUptestRoom(dataphongthi: { phongso: number, soluong }[], dsthisinh: ThptHoiDongThiSinh[]) {
    const phongCanthiet: TestRoomPreSet[] = dataphongthi.map(phong => {

      return {phongso: phong.phongso, soluong: phong.soluong, thisinh: [], soluong_thucte: 0, created: false}
    });
    let indexRoom = 0;
    for (let ts = 0; ts < dsthisinh.length; ts++) {
      const thisinhparram = dsthisinh[ts];
      const dk1 = phongCanthiet[indexRoom].soluong
      const dk2 = phongCanthiet[indexRoom].thisinh.length;
      if (dk2 >= dk1) {
        indexRoom++;
      }
      phongCanthiet[indexRoom].thisinh.push(thisinhparram);
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
    const phongsoParam = info.phongso < 10 ? '00' + info.phongso : info.phongso.toString();
    const phongcreate = {
      ten_phongthi: info.phongso,
      ma_phongthi: 'P' + phongsoParam + '.' + this.hoidong_id + '.' + this.kehoach_id,
      hoidong_id: this.hoidong_id,
      kehoach_id: this.kehoach_id,
      cathi_id: cathi_id,
      soluong_thucte: info.thisinh.length,
      soluong_toida: info.soluong
    };
    return this.hoidongPhongThiService.create(phongcreate).pipe(switchMap(phongthi_id => {
      return this.createdataPhongthiThisinh(phongthi_id, cathi_id, info)
    }))
  }

  // private createdataPhongthiThisinh(phongthi_id: number, cathi_id: number, info: TestRoomPreSet): Observable<number[]> {
  //   const requests$: Observable<any>[] = [];
  //
  //   info.thisinh.forEach((r, index) => {

  //     const object = {
  //       phongthi_id: phongthi_id,
  //       hoidong_id: this.hoidong_id,
  //       kehoach_id: this.kehoach_id,
  //       cathi_id: cathi_id,
  //       mon_id: r.monthi_ids[0],
  //       thisinh_id: r.thisinh_id,
  //
  //     }
  //     const request$ = this.thptPhongthiThisinh.create(object);
  //     requests$.push(request$);
  //   });
  //   return forkJoin(requests$);
  // }

  private createdataPhongthiThisinh(phongthi_id: number, cathi_id: number, info: TestRoomPreSet): Observable<number> {
    return from(info.thisinh).pipe(
      concatMap((r, index) => {
        const object = {
          phongthi_id: phongthi_id,
          hoidong_id: this.hoidong_id,
          kehoach_id: this.kehoach_id,
          cathi_id: cathi_id,
          mon_id: r.monthi_ids[0],
          thisinh_id: r.thisinh_id,
        };
        return this.thptPhongthiThisinh.create(object);
      })
    );
  }



  covertId(iput: number) {
    return iput < 10 ? '000' + iput : (iput >= 10 && iput < 100 ? '00' + iput : (iput >= 100 && iput < 1000 ? '0' + iput : iput));
  }

  // --------------------phong thi -------------------------------
  btnViewSitePhongthi(item: ThptCathi) {
    this.switchPage = "PHONGTHI";
    this.caThiSelect = item;
    this.loadDataPhongthi();
  }

  loadDataPhongthi() {
    this.notifi.isProcessing(true)
    this.isLoading = true;
    this.hoidongPhongThiService.getDataByKehoachIdAndCathiId(this.hoidong_id, this.caThiSelect.id).subscribe({
      next: (data) => {
        this.dsPhongThi = data?.filter(Boolean).map((m, index) => {
          m['__index_table'] = index + 1;
          m['__soluong_thisinh_converted'] = (m.soluong_thucte < 10 ? '0' + m.soluong_thucte : m.soluong_thucte.toString()) + '/' + m.soluong_toida;
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

  btnReturnPhongthi() {
    this.switchPage = "PHONGTHI";

  }

  dataThisinhInphong: ThptHoiDongThiSinh[];

  btnViewInfoByPhongThi(item: ThptHoiDongPhongThi) {

    this.phongthi_select = item;
    this.switchPage = "CHITIET_PHONGTHI";
    this.notifi.isProcessing(true);
    this.thptPhongthiThisinh.getDataByHoidongIdAndCathiIdAndPhongId(this.hoidong_id, this.caThiSelect.id, item.id).subscribe({
      next: (data) => {

        this.dataThisinhInphong = data.map((m, index) => {
          const thisinh = m['thisinh'];
          m['__index'] = index + 1;
          m['_sobaodanh'] = this.hoidong.tiento_sobaodanh + this.covertId(m.thisinh_id);
          m['_hoten'] = thisinh ? thisinh['hoten'] : '';
          m['_ngaysinh'] = thisinh ? thisinh['ngaysinh'] : '';
          m['_cccd_so'] = thisinh ? thisinh['cccd_so'] : '';
          m['_gioitinh'] = thisinh && thisinh['gioitinh'] === 'nu' ? 'Nữ' : 'Nam';
          m['_phone'] = thisinh ? thisinh['phone'] : '';

          return m;
        })
        this.notifi.isProcessing(false);
      },
      error: (m) => {
        this.notifi.isProcessing(false);
        this.notifi.toastError('Load dữ liệu thí sinh không thành công ');
      }
    })
  }

  // ------------------------- album ảnh ----------------------------------
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

          // const dataMap = data.map((m) => {
          //   m['__ten_cathi'] = cathi.cathi;
          //   m['__ngaythi'] = this.strToTime(cathi.ngaythi);
          //   m['hoidong'] = this.hoidong
          //   return m;
          // })
          // if (data.length > 0) {
          //   this.htmlToPdfService.exportHtmlToWord(dataMap, fileName);
          //   this.modalService.dismissAll();
          //
          // } else {
          //   this.modalService.dismissAll();
          //   this.notifi.toastError('Chưa có dữ liệu thí sinh !');
          // }

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

  private loadphongthiWidththisinh(prj: ThptHoiDongPhongThi[]): Observable<ThptPhongthiThiSinh[]> {
    const requests$: Observable<any>[] = [];
    prj.forEach((r, index) => {
      const phong_id = r.id;
      const request$ =
        this.thptPhongthiThisinh.getDataByPhongthiId(phong_id).pipe(switchMap((thisinhs) => {
            return this.loadThiSinhAvatarProcess(thisinhs).pipe(map(m => {
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

  private loadThiSinhAvatarProcess(info: ThptPhongthiThiSinh[]): Observable<ThptPhongthiThiSinh[]> {
    try {

      const index: number = info.findIndex(t => !t['_avatarLoaded']);
      if (index !== -1) {
        return this.fileService.getFileAsBlobByName(info[index]['thisinh']['anh_chandung'][0].id.toString()).pipe(switchMap(blob => {
          info[index]['_avatarLoaded'] = true;
          return forkJoin<[string, ThptPhongthiThiSinh[]]>(
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


  btnSendEmail() {

  }

  btnExportExcelRoom(item) {
  }

  btnReturnCathi() {
    this.switchPage = "CATHI";
    this.resetFormCathi()
  }


}



