import {ThptPhongthiThisinhService} from './../../../../../shared/services/thpt-phongthi-thisinh.service';
import {ThemeSettingsService} from './../../../../../../core/services/theme-settings.service';
import {Observable, interval, of} from 'rxjs';
import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {NotificationService} from '@core/services/notification.service';
import {DmMon} from '@modules/shared/models/danh-muc';
import {ThptHoiDong, ThptHoiDongService} from '@modules/shared/services/thpt-hoi-dong.service';
import {OrdersMonhocTHPT} from '@modules/shared/services/thpt-order-monhoc.service';
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {DanhMucToHopMonService} from "@shared/services/danh-muc-to-hop-mon.service";
import {KeHoachThi, ThptKehoachThiService} from "@shared/services/thpt-kehoach-thi.service";
import {forkJoin} from 'rxjs';
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ThptHoiDongPhongThi, ThptHoiDongThiSinh} from "@shared/models/thpt-model";
import {ThptHoidongPhongthiService} from "@shared/services/thpt-hoidong-phongthi.service";
import {ThptHoidongThisinhService} from '@modules/shared/services/thpt-hoidong-thisinh.service';
import {Paginator} from "primeng/paginator";

import {ExpostExcelPhongthiThisinhService} from '@modules/shared/services/expost-excel-phongthi-thisinh.service';

import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {WAITING_POPUP} from "@shared/utils/syscat";
import {SenderEmailService} from '@modules/shared/services/sender-email.service';
import {DanhMucPhongThiService, DmPhongThi} from "@shared/services/danh-muc-phong-thi.service";
import {ThptCathi, ThptHoidongCathiService} from "@shared/services/thpt-hoidong-cathi.service";
import {HelperService} from "@core/services/helper.service";

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
  hoiDongData: ThptHoiDong;
  TypeChangePage: -1 | 0 | 1 | 2 | 3 = 0; // 0: not data room//1:have data room //3:showDataroom -1 load
  switchPage: 'CATHI' | 'PHONGTHI' | 'CHITIET-PHONGTHI' = 'CATHI';


  dmMon: DmMon[];

  keHoachThi: KeHoachThi;
  formSave: FormGroup;
  formPhongthi: FormGroup;
  loadingBtn: boolean = false;
  thisinhOrder: OrdersMonhocTHPT[];
  hoiDongPhongThi: ThptHoiDongPhongThi[];
  page: number = 1;
  hoiDongPhongThiSelect: ThptHoiDongPhongThi;
  recordsTotal: number = 0;
  rows = this.themeSettingsService.settings.rows;
  thptThisinh: ThptHoiDongThiSinh[];


  dataPhongThi: { phongso: number, soluong: number }[] = [];
  danhmucPhongThi: DmPhongThi[];
  radioButton = [
    {id: '1', label: "Sắp xếp Ngẫn nhiên", value: 'NN'},
    {id: '2', label: "Sắp xếp từ a -> z", value: 'AZ'},
  ]

  // ---------------------- Ca thi --------------------------
  isLoading: boolean = true;
  dataCaThi: ThptCathi[] = [];
  typeAdd: 'ADD' | 'UPDATE' = "ADD";
  formCathi: FormGroup;
  caThiSelect: ThptCathi;

  constructor(
    private themeSettingsService: ThemeSettingsService,
    private hoiDongService: ThptHoiDongService,
    private notifi: NotificationService,
    private monService: DanhMucMonService,
    private fb: FormBuilder,
    private exportExcelService: ExpostExcelPhongthiThisinhService,
    private modalService: NgbModal,
    private senderEmailService: SenderEmailService,
    private danhMucPhongThiService: DanhMucPhongThiService,
    private phongthiThisinhService: ThptPhongthiThisinhService,
    private hoidongThissinhService: ThptHoidongThisinhService,
    private thptHoidongCathiService: ThptHoidongCathiService,
    private helperService: HelperService
  ) {
    this.formCathi = this.fb.group({
      hoidong_id: [this.hoidong_id, Validators.required],
      cathi: ['', Validators.required],
      ngaythi: ['', Validators.required],
      mota: ['', Validators.required],
    });

    this.formPhongthi = this.fb.group({
      hoidong_id: [this.hoidong_id ? this.hoidong_id : null, Validators.required],
      monthi: [null, Validators.required],
      type_sapxep: ['NN', Validators.required],
    });

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.hoidong_id) {
      this.switchPage = 'CATHI';
    }
  }


  ngOnInit(): void {
    if (this.hoidong_id) {
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
    this.thptHoidongCathiService.getDataUnlimitByhoidongId(this.hoidong_id).subscribe({
      next: (data) => {
        this.dataCaThi = data.map((m, index) => {
          m['_indexTable'] = index + 1;
          m['__ngaythi_coverted'] = this.strToTime(m.ngaythi);
          m['__cathiCoverted'] = `<b>${m.cathi}</b><br>` + m.mota;
          return m;
        });
        console.log(data);

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
          console.log(this.dataCaThi);
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
    console.log(this.formCathi);
    if (this.formCathi.valid) {
      const timetoServer = this.helperService.strToSQLDate(this.formCathi.value.ngaythi);
      console.log(timetoServer);
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
      this.btnSubmitPhongthi(this.dataPhongThi, this.dataThisinhInHoidong, monthi);
    } else {
      this.notifi.toastWarning('Bạn chưa chọn môn thi');
    }
  }

  resetFormPhongthi() {
    this.formPhongthi.reset({})
  }

  dataThisinhInHoidong: ThptHoiDongThiSinh[];

  loadDataDm() {
    this.notifi.isProcessing(true);

    forkJoin<[DmPhongThi[], ThptHoiDongThiSinh[]]>(
      this.danhMucPhongThiService.getDataUnlimit(),
      this.hoidongThissinhService.getDataByHoiDongIdNotPage(this.hoidong_id)
    ).subscribe({
      next: ([dmPhongthi, data]) => {

        this.dataPhongThi = this.convertDmPhongThi(dmPhongthi);

        const dataThisinhHoidong = data.map(m => {
          const thisinh = m['thisinh'];
          m['__thisinh_ten'] = thisinh ? thisinh['ten'] : '';
          return m;
        });
        this.dataThisinhInHoidong = this.sortByFirstLetterAlternate(dataThisinhHoidong);
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

  sortByFirstLetterAlternate(arr: ThptHoiDongThiSinh[]) {
    if (arr.length <= 0) {
      return arr;
    } else {
      const sortedByFirstLetter = arr.sort((a, b) => {
        const nameA = a['__thisinh_ten'].charAt(0).toUpperCase();
        const nameB = b['__thisinh_ten'].charAt(0).toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
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
  btnSubmitPhongthi(dataphongthi: {
    soluong: number,
    phongso: number
  }[], datathisinh: ThptHoiDongThiSinh[], dataMonthi: { id: number, mon_id: number, timestart: string }[]) {

    if (this.formPhongthi.valid) {
      dataMonthi.forEach((f, index) => {
        var uniqueThisinhIds = new Set();
        datathisinh.forEach(ts => {
          if (ts.monthi_ids.includes(f.id)) {
            uniqueThisinhIds.add(ts.thisinh_id);
          }
        });
        f['thisinh_ids'] = [...uniqueThisinhIds];
      });
      this.createPhongThi(dataphongthi, dataMonthi, this.f['type_sapxep'].value);

    } else {
      this.notifi.toastWarning('Vui lòng chọn đủ thông tin');
    }

  }


  createPhongThi(dataphongthi: { phongso: number, soluong: number }[], dataMonthi, type: 'NN' | 'AZ') {


    const phongCanthiet = dataphongthi.map((phong, index) => {
      const keyMonthi: { mon_id: number, thisinhIds: number[] }[] = [];
      dataMonthi.forEach((monthi, index) => {
        const monthicreate = {mon_id: monthi.mon_id, thisinhIds: []};
        keyMonthi.push(monthicreate);
      })
      return {phongso: phong.phongso, soluong: phong.soluong, monthi: keyMonthi}
    })
    console.log(phongCanthiet);
    dataMonthi.forEach((item,i)=>{
      console.log(item);
      const dsthisinh = item.thisinh_ids;
      console.log(dsthisinh);
      let indexRoom = 0;
      for(let ts= 0; ts< dsthisinh.length ;ts++){
        const ts_id = dsthisinh[ts];
        console.log(ts_id)
        console.log('use phong cần thiết', phongCanthiet[indexRoom]);
        console.log('dk 1', phongCanthiet[indexRoom].soluong);
        const dk1 = phongCanthiet[indexRoom].soluong
        console.log('dk 2', phongCanthiet[indexRoom].monthi.find(f=>f.mon_id === item.mon_id).thisinhIds.length);
        const dk2 =phongCanthiet[indexRoom].monthi.find(f=>f.mon_id === item.mon_id).thisinhIds.length;
        console.log('tt dk 2:',phongCanthiet[indexRoom].monthi.find(f=>f.mon_id === item.mon_id));
        if(dk2>= dk1){
          indexRoom++;
          console.log(indexRoom);
        }
        phongCanthiet[indexRoom].monthi.find(f=>f.mon_id === item.mon_id).thisinhIds.push(ts_id);

      }

    })

    console.log(phongCanthiet);


    // dataMonthi.forEach((item, index) => {
    //
    //   const thisinhForMonthis = item.thisinh_ids;
    //   console.log(thisinhForMonthis);
    //   for (let i = 0; i < thisinhForMonthis.length ;i++){
    //     const thisinhForMonthi = thisinhForMonthis[i];
    //     let indexPhong = 0;
    //     console.log('indexphong', indexPhong);
    //     // kiểm tra số luong thi sinh đang ky môn ở phong có vị trí indexPhong >= soluong tai phong tại vị trí indexphong
    //     console.log('soluong', phongCanthiet[indexPhong].soluong);
    //     console.log('phong select hien tại', phongCanthiet[indexPhong]);
    //     console.log(phongCanthiet[indexPhong].monthi.find(f=>f.mon_id === item.mon_id).thisinhIds);
    //     console.log('bien so sanh 1', phongCanthiet[indexPhong].monthi.find(f=>f.mon_id === item.mon_id).thisinhIds.length);
    //     console.log('bien so sanh 2', phongCanthiet[indexPhong].soluong);
    //
    //     if( phongCanthiet[indexPhong].monthi.find(f=>f.mon_id === item.mon_id).thisinhIds.length >= phongCanthiet[indexPhong].soluong ){
    //       indexPhong = indexPhong +1;
    //     }
    //     console.log('indexphong sau if', indexPhong)
    //     console.log( phongCanthiet[indexPhong].soluong)
    //
    //
    //     phongCanthiet[indexPhong].monthi.find(f=>f.mon_id === item.mon_id).thisinhIds.push(thisinhForMonthi);
    //   }
    // })
    // dataMonthi.forEach((item, index) => {
    //   const thisinhForMonthis = item.thisinh_ids;
    //   let indexPhong = 0;
    //   for (let i = 0; i < thisinhForMonthis.length ; i++) {
    //     const thisinhForMonthi = thisinhForMonthis[i];
    //     const currentRoom = phongCanthiet[indexPhong];
    //     const currentSubject = currentRoom.monthi.find(f => f.mon_id === item.mon_id);
    //
    //     // Kiểm tra xem phòng hiện tại đã đầy chưa
    //     if (currentSubject.thisinh_ids.length >= currentRoom.soluong) {
    //       // Nếu phòng đã đầy, chuyển sang phòng tiếp theo
    //       indexPhong++;
    //       // Nếu không có phòng nào còn trống, dừng vòng lặp
    //       if (indexPhong >= phongCanthiet.length) {
    //         break;
    //       }
    //     }
    //
    //     // Thêm thí sinh vào phòng hiện tại
    //     currentSubject.thisinh_ids.push(thisinhForMonthi);
    //   }
    // });

    // return phongCanthiet;

  }

}
