import {forkJoin, from, Observable, of, switchMap} from 'rxjs';
import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {NotificationService} from '@core/services/notification.service';
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ThptHoiDongPhongThi, ThptHoiDongThiSinh} from "@shared/models/thpt-model";
import {ThptHoidongThisinhService} from '@modules/shared/services/thpt-hoidong-thisinh.service';
import {Paginator} from "primeng/paginator";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {DanhMucPhongThiService, DmPhongThi} from "@shared/services/danh-muc-phong-thi.service";
import {ThptCathi, ThptHoidongCathiService} from "@shared/services/thpt-hoidong-cathi.service";
import {HelperService} from "@core/services/helper.service";
import {ThemeSettingsService} from "@core/services/theme-settings.service";

import {ThptHoidongPhongthiService} from "@shared/services/thpt-hoidong-phongthi.service";
import {ThptPhongThiMonThi, ThptPhongthiMonthiService} from "@shared/services/thpt-phongthi-monthi.service";
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {DmMon} from "@shared/models/danh-muc";
import {ThisinhInfoService} from "@shared/services/thisinh-info.service";
import {ThiSinhInfo} from "@shared/models/thi-sinh";
import {SenderEmailService} from "@shared/services/sender-email.service";
import {WAITING_POPUP} from "@shared/utils/syscat";
import {HtmlToPdfService} from "@shared/services/html-to-pdf.service";
import {OvicFile} from "@core/models/file";
import {FileService} from "@core/services/file.service";
import {ThptHoiDong, ThptHoiDongService} from "@shared/services/thpt-hoi-dong.service";
import {catchError, map} from "rxjs/operators";
import {BUTTON_NO, BUTTON_YES} from "@core/models/buttons";

interface MonthiTest {
  mon_id: number;
  timeStart: string;
  thisinhIds: number[];
}

interface TestRoomPreSet {
  phongso: number,
  soluong: number,
  soluong_thucte: number,
  monthi: MonthiTest[],
  created: boolean;
}

interface infoPhongthi {
  ten_phongthi: string;
  cathi_phongthi: string;
  cathi_ngaythi: string;
  time_ngaythi: string;
  monthi: string;
}

interface FormatthisinhSendEmail {
  thisinh_id: number;
  thissinh: any;
  infos: infoPhongthi[];
  created: boolean;
}

interface ListAvatar {
  src: string,
  fileInfo: OvicFile;
  file: File,

}

@Component({
  selector: 'app-phong-thi',
  templateUrl: './phong-thi.component.html',
  styleUrls: ['./phong-thi.component.css']
})
export class PhongThiComponent implements OnInit, OnChanges {
  @Input() hoidong_id: number;
  @Input() kehoach_id: number;
  @ViewChild(Paginator) paginator: Paginator;
  @ViewChild('templateWaiting') templateWaiting: ElementRef;

  dmMon: DmMon[];
  switchPage: 'CATHI' | 'PHONGTHI' | 'CHITIET_PHONGTHI' = 'CATHI';
  formSave: FormGroup;
  formPhongthi: FormGroup;
  page: number = 1;
  recordsTotal: number = 0;
  rows = this.themeSettingsService.settings.rows;
  dataPhongThi: { phongso: number, soluong: number }[] = [];

  // ---------------------- Ca thi --------------------------
  isLoading: boolean = true;
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
  monthi_id_Select: number = 0;


  private listAvatar: ListAvatar[] = [];

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
    private phongthiMonthiService: ThptPhongthiMonthiService,
    private dmMonthiService: DanhMucMonService,
    private thisinhInfoService: ThisinhInfoService,
    private senderEmailService: SenderEmailService,
    private htmlToPdfService: HtmlToPdfService,
    private fileService: FileService,
    private thptHoiDongService: ThptHoiDongService
  ) {
    this.formCathi = this.fb.group({
      hoidong_id: [this.hoidong_id, Validators.required],
      cathi: ['', Validators.required],
      ngaythi: ['', Validators.required],
      mota: [''],
    });

    this.formPhongthi = this.fb.group({
      hoidong_id: [this.hoidong_id ? this.hoidong_id : null, Validators.required],
      monthi: [null, Validators.required],
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
    this.loadDataCathi();
  }

  loadDataCathi() {
    this.notifi.isProcessing(true);
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
          return m;
        });
        this.isLoading = false;
        this.notifi.isProcessing(false);
      },
      error: () => {
        this.isLoading = false;
        this.notifi.isProcessing(false);
        this.notifi.toastError('Load dữ liệu không thành công');
      }
    })
  }

  hoidong: ThptHoiDong;

  strToTime(input: string): string {
    const date = input ? new Date(input) : null;
    let result = '';
    if (date) {
      result += [date.getDate().toString().padStart(2, '0'), (date.getMonth() + 1).toString().padStart(2, '0'), date.getFullYear().toString()].join('/');
      // result += ' ' + [date.getHours().toString().padStart(2, '0'), date.getMinutes().toString().padStart(2, '0')].join(':');
    }
    return result;
  }

  btnUpDataCathi(item: ThptCathi) {
    this.typeAdd = "UPDATE";
    this.caThiSelect = item;

    this.formCathi.reset({
      hoidong_id: this.hoidong_id,
      cathi: item.cathi,
      ngaythi: item.ngaythi ? new Date(item.ngaythi) : null,
      mota: item.mota,
    })
  }

  resetFormCathi() {
    this.typeAdd = "ADD";
    this.formCathi.reset({
      hoidong_id: this.hoidong_id,
      cathi: '',
      ngaythi: '',
      mota: '',
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

  submitFormCathi() {

    if (this.formCathi.valid) {
      const timetoServer = this.helperService.strToSQLDate(this.formCathi.value.ngaythi);
      this.formCathi.value.ngaythi.value = timetoServer;
      const observer$: Observable<any> = this.typeAdd === 'ADD' ? this.thptHoidongCathiService.create(this.formCathi.value) : this.thptHoidongCathiService.update(this.caThiSelect.id, this.formCathi.value);
      observer$.subscribe({
        next: () => {
          this.loadDataCathi();
          this.resetFormCathi();
          this.notifi.toastSuccess('Thao tác thành công', 'Thông báo');
        },
        error: () => this.notifi.toastError('Thao tác thất bại', 'Thông báo')
      });
    } else {
      this.notifi.toastWarning('Vui lòng nhập đủ thông tin');
    }
  }

  btnViewSitePhongthi(item: ThptCathi) {
    this.switchPage = "PHONGTHI";
    this.caThiSelect = item;
    this.loadDataDm()
    this.resetFormPhongthi();
  }

  btnReturnCathi() {
    this.switchPage = "CATHI";

  }


  get f(): { [key: string]: AbstractControl<any> } {
    return this.formPhongthi.controls;
  }

  submitFormPhongthi() {

    const monthi = this.f['monthi'].value;
    this.f['hoidong_id'].setValue(this.hoidong_id);
    if (this.checkKeyNotNull(monthi, 'mon_id')) {
      if (this.dataThisinhInHoidong.length > 0) {
        this.btnSubmitPhongthi(this.dataPhongThi, this.dataThisinhInHoidong, monthi);
      } else {
        this.notifi.toastWarning('Bạn chưa thêm thí sinh vào hội đồng thi')
      }

    } else {
      this.notifi.toastWarning('Bạn chưa chọn môn thi');
    }
  }

  resetFormPhongthi() {
    this.formPhongthi.reset({
      hoidong_id: this.hoidong_id,
      monthi: {mon_id: null, timeStart: null},
    })
  }

  dataThisinhInHoidong: ThptHoiDongThiSinh[];

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
        this.loadDataPhongthi();
        this.notifi.isProcessing(false);
      },
      error: () => {
        this.notifi.isProcessing(false);
      }
    })

  }

  // ----------- covert phong thi và thi sinh và môn thi------------//
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

  checkKeyNotNull(array, keyToCheck) {
    var anyNull = false;
    for (var i = 0; i < array.length; i++) {
      if (keyToCheck in array[i] && array[i][keyToCheck] === null) {
        anyNull = true;
        break;
      }

    }
    return !anyNull;
  }

  //-------------- sử lý data phòng thi -----------------//

  loadDataPhongthi() {
    this.notifi.isProcessing(true)
    this.isLoading = true;
    this.hoidongPhongThiService.getDataByKehoachIdAndCathiId(this.hoidong_id, this.caThiSelect.id).pipe(switchMap(project => {
      const ids = project.map(m => m.id);
      return forkJoin<[ThptHoiDongPhongThi[], ThptPhongThiMonThi[]]>(of(project), this.phongthiMonthiService.getDataByphongthiIds(ids))
    })).subscribe({
      next: ([data, monthis]) => {
        this.dsPhongThi = data?.filter(Boolean).map((m, index) => {
          m['__indexTable'] = index + 1;

          m['__monthi_covered'] = this.dmMon ? m.monthi_ids.map(b => this.dmMon.find(f => f.id == b) ? this.dmMon.find(f => f.id == b) : []) : [];
          const monthi_coverted = monthis.filter(f => f.phongthi_id === m.id).map(b => {
            b['__soluong_thisinh'] = b.thisinh_ids.length;
            b['__soluong_thisinh_converted'] = b.thisinh_ids.length + '/' + m.soluong_toida;
            b['__tenmon'] = this.dmMon.find(a => a.id === b.monthi_id) ? this.dmMon.find(a => a.id === b.monthi_id).tenmon : '';
            return b;
          })

          m['__dataMonthi'] = m.monthi_ids.map(a => monthi_coverted.find(c => c.monthi_id === a));
          return m;
        })
        this.notifi.isProcessing(false)
        this.isLoading = false;

      }, error: () => {
        this.isLoading = false;

        this.notifi.isProcessing(false)
        this.notifi.toastError('Load dữ liệu không thành công');
      }
    })
  }

  btnSubmitPhongthi(dataphongthi: {
    soluong: number,
    phongso: number
  }[], datathisinh: ThptHoiDongThiSinh[], dataMonthi: { id: number, mon_id: number, timestart: string }[]) {
    if (this.formPhongthi.valid) {

      dataMonthi.forEach((f, index) => {
        const uniqueThisinhIds = new Set();
        datathisinh.forEach(ts => {
          if (ts.monthi_ids.find(mt => mt === f.mon_id)) {
            uniqueThisinhIds.add(ts.thisinh_id);
          }
        });
        f['thisinh_ids'] = [...uniqueThisinhIds];
      })
      const newPhongs = this.setupTestRoom(dataphongthi, dataMonthi);
      const step: number = 100 / newPhongs.length;
      this.notifi.loadingAnimationV2({process: {percent: 0}});
      this.createTestRoomControl(newPhongs, step, 0).subscribe({
        next: (mess) => {
          this.notifi.toastSuccess('Tạo mới thành công');
          this.loadDataPhongthi();
        },
        error: (error) => {
          this.notifi.toastError('Tạo mới không thành công');
          this.loadDataPhongthi();
        },
      })
    } else {
      this.notifi.toastWarning('Vui lòng chọn đủ thông tin');
    }
  }

  private createTestRoomControl(list: TestRoomPreSet[], step: number, percent: number): Observable<any> {
    const index: number = list.findIndex(i => !i.created);
    if (index !== -1) {
      return this.createTestRoom(list[index]).pipe(switchMap(() => {
        list[index].created = true;
        const newPercent: number = percent + step;
        this.notifi.loadingAnimationV2({process: {percent: newPercent}});
        return this.createTestRoomControl(list, step, newPercent);
      }))
    } else {
      this.notifi.disableLoadingAnimationV2();
      return of('complete');
    }
  }

  private createTestRoom(info: TestRoomPreSet): Observable<number[]> {
    const phongsoParam = info.phongso < 10 ? '00' + info.phongso : (info.phongso >= 10 && info.phongso < 100 ? '0' + info.phongso : info.phongso.toString());
    const phongcreate = {
      ten_phongthi: 'Phòng ' + phongsoParam,
      ma_phongthi: 'P' + phongsoParam + '.' + this.hoidong_id + '.' + this.kehoach_id,
      hoidong_id: this.hoidong_id,
      kehoach_id: this.kehoach_id,
      cathi_id: this.caThiSelect.id,
      monthi_ids: info.monthi.map(m => m.mon_id),
      soluong_toida: info.soluong
    };
    return this.hoidongPhongThiService.create(phongcreate).pipe(switchMap(phongthiId => {
      const arrCreateSubjects: Observable<number>[] = info.monthi.reduce((reducer, subject) => {
        reducer.push(
          this.phongthiMonthiService.create({
            hoidong_id: this.hoidong_id,
            phongthi_id: phongthiId,
            monthi_id: subject.mon_id,
            thisinh_ids: subject.thisinhIds,
            timeStart: new Date(subject.timeStart).getHours() + ':' + new Date(subject.timeStart).getMinutes()
          })
        );
        return reducer;
      }, new Array<Observable<number>>())
      return forkJoin<number[]>(arrCreateSubjects)
    }))
  }

  setupTestRoom(dataphongthi: { phongso: number, soluong: number }[], dataMonthi): TestRoomPreSet[] {

    const phongCanthiet: TestRoomPreSet[] = dataphongthi.map((phong, index) => {
      const keyMonthi: MonthiTest[] = [];
      dataMonthi.forEach((monthi, index) => {
        const monthicreate = {mon_id: monthi.mon_id, timeStart: monthi.timeStart, thisinhIds: []};
        keyMonthi.push(monthicreate);
      })
      return {phongso: phong.phongso, soluong: phong.soluong, soluong_thucte: 0, monthi: keyMonthi, created: false}
    })
    dataMonthi.forEach((item, i) => {
      const dsthisinh = item.thisinh_ids;
      let indexRoom = 0;
      for (let ts = 0; ts < dsthisinh.length; ts++) {
        const ts_id = dsthisinh[ts];
        const dk1 = phongCanthiet[indexRoom].soluong
        const dk2 = phongCanthiet[indexRoom].monthi.find(f => f.mon_id === item.mon_id).thisinhIds.length;
        if (dk2 >= dk1) {
          indexRoom++;
        }
        phongCanthiet[indexRoom].monthi.find(f => f.mon_id === item.mon_id).thisinhIds.push(ts_id);
        phongCanthiet[indexRoom].soluong_thucte += 1;
      }
    })
    return phongCanthiet.filter(f => f.soluong_thucte !== 0);
  }

  async deletePhongthi(item) {
    const confirm = await this.notifi.confirmDelete();
    if (confirm) {
      this.hoidongPhongThiService.delete(item.id).subscribe({
        next: () => {
          this.dsPhongThi = this.dsPhongThi.filter(u => u.id !== item.id);
          this.notifi.isProcessing(false);
          this.notifi.toastSuccess('Xóa phòng thi thành công');
        },
        error: () => {
          this.notifi.isProcessing(false);
          this.notifi.toastError('Xóa Phòng thi không thành công');
        },
      })
    }
  }


  btnViewInfoByPhongThi(item) {
    this.phongthi_select = item;
    this.switchPage = "CHITIET_PHONGTHI";
    this.monthi_id_Select = 0;
  }

  btnReturnPhongthi() {
    this.switchPage = "PHONGTHI";
    this.dsThisinhInMonThi = [];
    this.monthi_id_Select = 0;
  }

  selectMonThiInphongthi(item: ThptPhongThiMonThi) {
    this.dsThisinhInMonThi = [];
    this.monthi_Phongthi_select = item;
    this.notifi.isProcessing(true);
    this.monthi_id_Select = item.monthi_id;
    // monthi
    const thisinhIDs = item.thisinh_ids;
    this.thisinhInfoService.getDataBythisinhIds(thisinhIDs).subscribe({
      next: (data) => {
        const dataNew = thisinhIDs.map(m => data.find(f => f.id === m));
        this.dsThisinhInMonThi = dataNew?.filter(Boolean).map((m, index) => {
          m['__indexTable'] = index + 1;
          return m;
        })

        this.notifi.isProcessing(false);

      }, error: () => {
        this.notifi.isProcessing(false);
        this.notifi.toastError('Load Dữ liệu thí sinh')
      }
    })
  }

  async btnSendEmail() {
    const button = await this.notifi.confirmRounded('Gửi email thông báo lịch thi cho thí sinh ','XÁC NHẬN',  [BUTTON_NO,BUTTON_YES]);
    if (button.name === BUTTON_YES.name) {
      const cathi_ids = this.dataCaThi.map(f => f.id);
      this.hoidongPhongThiService.getDataByHoidongVaCathiIds(this.hoidong_id, cathi_ids).pipe(switchMap(prj => {
        const phongthi_ids = prj.map(m => m.id);
        return forkJoin<[ThptHoiDongPhongThi[], ThptPhongThiMonThi[]]>(of(prj), this.phongthiMonthiService.getDataByphongthiIds(phongthi_ids))
      })).subscribe({
        next: ([datahoidongPhongThi, datahoidongmonthi]) => {
          const dataPhongthi = datahoidongPhongThi ? datahoidongPhongThi.map(m => {
            const cathi = this.dataCaThi.find(f => f.id === m.cathi_id);
            m['__cathi_Covented'] = cathi ? cathi.cathi : '';
            m['__ngaythi'] = cathi ? this.helperService.formatSQLToDateDMY(new Date(cathi.ngaythi)) : '';
            return m;
          }) : [];
          const dataPhongthiMonThi = datahoidongmonthi ? datahoidongmonthi.filter(f => f.thisinh_ids.length !== 0).sort((a, b) => a.phongthi_id - b.phongthi_id).map(m => {
            m['__phongthi'] = dataPhongthi.find(f => f.id === m.phongthi_id);
            m['__thisinh_sapxep'] = m.thisinh_ids.map(a => m['thisinh'].find(b => b.id === a));
            return m;
          }) : [];


          const thisinhForm: FormatthisinhSendEmail[] = [];
          dataPhongthiMonThi.forEach((item) => {
            const phongthi = item['__phongthi'];
            const ten_phongthi = phongthi ? phongthi['ten_phongthi'] : '';
            const cathi_phongthi = phongthi ? phongthi['__cathi_Covented'] : '';
            const cathi_ngaythi = phongthi ? phongthi['__ngaythi'] : '';
            const time_ngaythi = item.timeStart;
            const monthi = this.dmMon.find(f => f.id === item.monthi_id).tenmon
            const info = {
              ten_phongthi: ten_phongthi,
              cathi_phongthi: cathi_phongthi,
              cathi_ngaythi: cathi_ngaythi,
              time_ngaythi: time_ngaythi
            };

            item.thisinh_ids.forEach(i => {
              const existingThisinhIndex = thisinhForm.findIndex((thisinh) => thisinh.thisinh_id === i);

              if (existingThisinhIndex !== -1) {
                thisinhForm[existingThisinhIndex].infos.push({
                  ten_phongthi: ten_phongthi,
                  cathi_phongthi: cathi_phongthi,
                  cathi_ngaythi: cathi_ngaythi,
                  time_ngaythi: time_ngaythi,
                  monthi: monthi
                });
              } else {

                const thisinh = {
                  thisinh_id: i,
                  thissinh: item['thisinh'] ? item['thisinh'].find(f => f.id === i) : null,
                  infos: [{
                    ten_phongthi: ten_phongthi,
                    cathi_phongthi: cathi_phongthi,
                    cathi_ngaythi: cathi_ngaythi,
                    time_ngaythi: time_ngaythi,
                    monthi: monthi
                  }],
                  created: false,
                };
                thisinhForm.push(thisinh);
              }
            });
          })
          //=========================send email new ver==================
          this.notifi.isProcessing(true);
          if(this.dataCaThi.length > 0 && dataPhongthi.length >0 && dataPhongthiMonThi.length >0){
            const step: number = 100 / thisinhForm.length;
            this.notifi.loadingAnimationV2({process: {percent: 0}});
            this.emailCall(thisinhForm, step, 0).subscribe({
              next: (mess) => {
                this.notifi.toastSuccess('Gửi Email thông báo lịch thi thành công');
                this.notifi.isProcessing(false);
              }, error: (error) => {
                this.notifi.toastError('Gửi Email thông báo lịch thi không thành công');
                this.notifi.isProcessing(false);
                this.notifi.disableLoadingAnimationV2();
              }
            })
          }else{
            this.notifi.isProcessing(false);
            this.notifi.toastWarning('Chưa có dữ liệu phòng thi');
          }

        },
        error: () => {
          this.notifi.isProcessing(false);
          this.notifi.toastError('Load dữ liệu không thành công');
        }
      })
    }
  }


  private emailCall(thisinhForm: FormatthisinhSendEmail[], step: number, percent: number) {
    const index: number = thisinhForm.findIndex(i => !i.created);
    if (index !== -1) {
      const item = thisinhForm[index];
      const email = item.thissinh ? item.thissinh['email'] : '';
      const thisinh = item.thissinh;
      let message = `

        <p style="font-size:20px;font-weight: 500"> Xin chào ${thisinh.hoten} !</p>

        <p>Hội đồng thi: TNU - Hội đồng thi Đại học Thái Nguyên</p>
        <p>Địa chỉ Điểm thi: Trung tâm Khảo thí và Quản lý chất lượng – ĐHTN,  Phường Tân Thịnh – Thành phố Thái Nguyên</p>


        <p style="font-weight:700;">THÔNG TIN THI SINH:</p>
        <table width="100%" style="border:0;">
            <tr>
                <td style="width:100px;">Họ và tên:</td>
                <td style="font-weight:600">${thisinh.hoten}</td>
            </tr>
            <tr>
                <td style="width:100px;">Ngày sinh:</td>
                <td style="font-weight:600">${thisinh.ngaysinh}</td>
            </tr>
            <tr>
                <td style="width:100px;">Giới tính:</td>
                <td style="font-weight:600">${thisinh.gioitinh === 'nam' ? "Nam" : 'Nữ'}</td>
            </tr>
            <tr>
                <td style="width:100px;">Dân tộc:</td>
                <td style="font-weight:600">${thisinh.dantoc}</td>
            </tr>
            <tr>
                <td style="width:100px;">Nơi sinh:</td>
                <td style="font-weight:600">${thisinh.noisinh}</td>
            </tr>
            <tr>
                <td style="width:100px;">Số CCCD:</td>
                <td style="font-weight:600">${thisinh.cccd_so}</td>
            </tr>
            <tr>
                <td style="width:150px;">Hộ khẩu thường trú:</td>
                <td style="font-weight:600">${thisinh.thuongtru_diachi.fullAddress}</td>
            </tr>
            <tr>
                <td style="width:100px;">Học sinh trường:</td>
                <td style="font-weight:600">${thisinh.lop12_truong ? thisinh.lop12_truong : (thisinh.lop11_truong ? thisinh.lop11_truong : (thisinh.lop10_truong ? thisinh.lop12_truong : ''))}</td>
            </tr>

        </table>

        <p style="font-weight:700;" >LỊCH THI CÁ NHÂN:</p>

        <p><strong>Số báo danh :</strong> ${'TNU' + item.thisinh_id} </p>
        <table style=" border: 1px solid black;border-collapse: collapse;">
          <tr style="border: 1px solid black;border-collapse: collapse;">
            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="50px"><strong>STT</strong></th>

            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="100px"><strong>Môn thi</strong></th>
            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="100px"><strong>Phòng Thi</strong></th>
            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="100px"><strong>Ngày thi</strong></th>
            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="250px"><strong>Thời gian gọi thí sinh vào phòng thi</strong></th>
          </tr>
    `;
      item.infos.forEach((monthi, index) => {
        message += `
      <tr style="border: 1px solid black;border-collapse: collapse;">
        <td style="border: 1px solid black;border-collapse: collapse; text-align:center;">${index + 1}</td>
        <td style="border: 1px solid black;border-collapse: collapse; text-align:left;">${monthi.monthi}</td>
        <td style="border: 1px solid black;border-collapse: collapse; text-align:center;">${monthi.ten_phongthi}</td>
        <td style="border: 1px solid black;border-collapse: collapse; text-align:center;">${monthi.cathi_ngaythi}</td>
        <td style="border: 1px solid black;border-collapse: collapse; text-align:center;">${monthi.time_ngaythi}</td>
      </tr>
        `;
      })
      message += `</table> <p>Thí sinh đến tập trung trước 30 phút để hoàn thành thủ tục vào thi và tiến tiến hành vào thi !</p>`
      const emailsend: any = {
        title: 'THÔNG BÁO LỊCH THI V-SAT-TNU',
        to: email,
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

  btnExportAlbum(cathi: ThptCathi) {

    this.modalService.open(this.templateWaiting, WAITING_POPUP);
    const fileName = cathi.cathi + '( ' + this.hoidong.ten_hoidong+ ' )' + ' - Danh sách thí sinh';
    const cathi_id = cathi.id;
    this.notifi.isProcessing(true);
    this.hoidongPhongThiService.getDataByHoidongVaCathiId(this.hoidong_id, cathi_id).pipe(
      switchMap(prj =>
        forkJoin([
          of(prj),
          this.loadThiSinhAvatar(prj)
        ])
      ),
      catchError(error => {
        return of([[], []]);
      }),
    ).subscribe({
      next: ([dataPhongthi, dataMonthi]) => {


        this.notifi.isProcessing(false);
        dataPhongthi.map(m => {
          m['__ten_cathi'] = cathi.cathi;
          const thisinhInphong = [];
          const dataMonthiInPhong = dataMonthi.filter(f => f.phongthi_id === m.id && f.thisinh_ids.length !== 0);
          dataMonthiInPhong.forEach((phieu) => {
            let danhSachThisinh = phieu['thisinh'];

            danhSachThisinh.forEach((thiSinh) => {
              let isExist = thisinhInphong.some((ts) => ts.id === thiSinh.id);
              if (!isExist) {
                thisinhInphong.push(thiSinh);
              }
            });
          })
          m['__thisinh_in_phong'] = thisinhInphong;
          m['__ngaythi'] = this.strToTime(cathi.ngaythi);
          return m;
        })

        if (dataPhongthi.length>0 && dataMonthi.length > 0) {
          this.htmlToPdfService.exportHtmlToWord(dataPhongthi, fileName);
          this.modalService.dismissAll();

        }else
        {
          this.modalService.dismissAll();
          this.notifi.toastError('Chưa có dữ liệu thí sinh !');
        }

      },
      error: (e) => {
        this.notifi.isProcessing(false);
        this.modalService.dismissAll()

      }
    })
  }

  private loadThiSinhAvatar(info: ThptHoiDongPhongThi[]): Observable<ThptPhongThiMonThi[]> {
    const ids = info.map(m => m.id);
    return this.phongthiMonthiService.getDataByphongthiIds(ids).pipe(switchMap((objects) => {
      const dsThiSinh: Observable<ThptPhongThiMonThi>[] = objects.filter(o => o.thisinh_ids && o.thisinh_ids.length).reduce((reducer, o) => {
        reducer.push(this.loadThiSinhAvatarProcess(o));
        return reducer;
      }, new Array<Observable<ThptPhongThiMonThi>>())
      return dsThiSinh.length ? forkJoin<ThptPhongThiMonThi[]>(dsThiSinh) : of(objects)
    }))
  }


  private loadThiSinhAvatarProcess(info: ThptPhongThiMonThi): Observable<ThptPhongThiMonThi> {
    try {
      const index: number = info['thisinh'].findIndex(t => !t['_avatarLoaded']);

      if (index !== -1) {
        return this.fileService.getFileAsBlobByName(info.thisinh[index].anh_chandung[0].id.toString()).pipe(switchMap(blob => {
          info.thisinh[index]['_avatarLoaded'] = true;
          return forkJoin<[string,ThptPhongThiMonThi]>(
            from(this.fileService.blobToBase64(blob)),
            this.loadThiSinhAvatarProcess(info)
          ).pipe(map(([src, loadedData]) => {
            loadedData.thisinh[index]['_avatarSrc'] = src ? src.replace('data:application/octet-stream;base64','data:image/jpeg;base64') : src;
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




}




