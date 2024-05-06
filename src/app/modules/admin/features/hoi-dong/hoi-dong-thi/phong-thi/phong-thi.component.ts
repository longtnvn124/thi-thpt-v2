import { ThptPhongthiThisinhService } from './../../../../../shared/services/thpt-phongthi-thisinh.service';
import { ThemeSettingsService } from './../../../../../../core/services/theme-settings.service';
import { Observable, interval, of } from 'rxjs';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { NotificationService } from '@core/services/notification.service';
import { DmMon, DmToHopMon } from '@modules/shared/models/danh-muc';
import { ThptHoiDong, ThptHoiDongService } from '@modules/shared/services/thpt-hoi-dong.service';
import { OrdersMonhocTHPT, ThptOrderMonhocService } from '@modules/shared/services/thpt-order-monhoc.service';
import { DanhMucMonService } from "@shared/services/danh-muc-mon.service";
import { DanhMucToHopMonService } from "@shared/services/danh-muc-to-hop-mon.service";
import { KeHoachThi, ThptKehoachThiService } from "@shared/services/thpt-kehoach-thi.service";
import { forkJoin } from 'rxjs';
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ThptHoiDongPhongThi, ThptHoiDongThiSinh } from "@shared/models/thpt-model";
import { ThptHoidongPhongthiService } from "@shared/services/thpt-hoidong-phongthi.service";
import { ThptHoidongThisinhService } from '@modules/shared/services/thpt-hoidong-thisinh.service';
import { Paginator } from "primeng/paginator";
import { NgPaginateEvent } from "@shared/models/ovic-models";
import { ExpostExcelPhongthiThisinhService } from '@modules/shared/services/expost-excel-phongthi-thisinh.service';
import { map, take } from 'rxjs/operators';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { WAITING_POPUP } from "@shared/utils/syscat";
import { SenderEmailService } from '@modules/shared/services/sender-email.service';
import { DanhMucPhongThiService, DmPhongThi } from "@shared/services/danh-muc-phong-thi.service";
import { ThiSinhService } from '@modules/shared/services/thi-sinh.service';
@Component({
  selector: 'app-phong-thi',
  templateUrl: './phong-thi.component.html',
  styleUrls: ['./phong-thi.component.css']
})
export class PhongThiComponent implements OnInit {
  @Input() hoidong_id: number;
  @Input() kehoach_id: number;
  @ViewChild(Paginator) paginator: Paginator;
  @ViewChild('templateWaiting') templateWaiting: ElementRef;
  hoiDongData: ThptHoiDong;
  TypeChangePage: -1 | 0 | 1 | 2 | 3 = 0; // 0: not data room//1:have data room //3:showDataroom -1 load

  dmMon: DmMon[];
  dmToHopMon: DmToHopMon[];
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


  dataPhongThi: { phongthi: number, soluong: number }[] = [];
  danhmucPhongThi: DmPhongThi[];
  radioButton = [
    { id: '1', label: "Sắp xếp Ngẫn nhiên", value: 'NN' },
    { id: '2', label: "Sắp xếp từ a -> z", value: 'AZ' },
  ]


  constructor(
    private themeSettingsService: ThemeSettingsService,
    private hoiDongService: ThptHoiDongService,
    private notifi: NotificationService,
    private monService: DanhMucMonService,
    private tohopmonService: DanhMucToHopMonService,
    private kehoachThiService: ThptKehoachThiService,
    private fb: FormBuilder,
    private hoidongPhongthiService: ThptHoidongPhongthiService,
    private hoidongThisinhService: ThptHoidongThisinhService,
    private exportExcelService: ExpostExcelPhongthiThisinhService,
    private modalService: NgbModal,
    private senderEmailService: SenderEmailService,
    private danhMucPhongThiService: DanhMucPhongThiService,
    private phongthiThisinhService: ThptPhongthiThisinhService
  ) {
    this.formSave = this.fb.group({
      ten_cathi: ['', Validators.required],
      hoidong_id: [this.hoidong_id],
      kehoach_id: [this.kehoach_id],
      monthi: [null, Validators.required],
      type_sapxep: ['NN', Validators.required],
      tiento: ['', Validators.required]
    });
  }


  ngOnInit(): void {
    if (this.hoidong_id) {
      this.loadInit();
    }
  }

  loadInit() {
    this.notifi.isProcessing(true);
    this.TypeChangePage = -1;
    this.hoiDongService.getHoidongonly(this.hoidong_id).subscribe({
      next: (data) => {
        this.hoiDongData = data;
        this.loadDmData(data.id);

        this.notifi.isProcessing(false);
      }, error: () => {
        this.notifi.isProcessing(false);
        this.notifi.toastError('Mất kết nối với máy chủ');
      }
    })
  }


  loadDmData(kehoach_id: number) {
    this.notifi.isProcessing(true);
    forkJoin<[DmMon[], DmToHopMon[], KeHoachThi, DmPhongThi[]]>([
      this.monService.getDataUnlimit(),
      this.tohopmonService.getDataUnlimit(),
      this.kehoachThiService.getDataById(kehoach_id),
      this.danhMucPhongThiService.getDataUnlimit()

    ]).subscribe({
      next: ([mon, tohopmon, kehoachthi, dmPhonthi]) => {
        this.dmMon = mon;
        this.dmToHopMon = tohopmon;
        this.keHoachThi = kehoachthi;
        this.danhmucPhongThi = dmPhonthi;
        this.notifi.isProcessing(false);
        this.dataPhongThi = this.convertData(this.danhmucPhongThi);

        this.loadDataPhongthi(this.kehoach_id, this.hoidong_id);
      }, error: () => {
        this.notifi.toastError('Mất kết nối với máy chủ');
        this.notifi.isProcessing(false);
      }
    })
  }
  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }


  convertData(data: DmPhongThi[]) {
    let result: any[] = [];
    for (let item of data) {
      let start = item.fromAt;
      let end = item.toAt;
      let soluong = item.soluong;
      for (let i = start; i <= end; i++) {
        result.push({ soluong: soluong, phongso: i });
      }
    }
    return result;
  }

  selectThisinhWithMonthi() {
    this.notifi.isProcessing(true);
    this.hoidongThisinhService.getDataByHoidongIdUnlimit(this.hoidong_id).subscribe({
      next: (data) => {

        const dataThisinhdanhky = data.map(m => {
          const _dataOrder = m['orders'];

          let mon_ids: number[] = [];
          if (_dataOrder) {
            _dataOrder.forEach(element => {
              mon_ids = mon_ids.concat(element['mon_id']);
            })
            m['_monthi_ids'] = mon_ids;
          } else {
            m['_monthi_ids'] = [];
          }

          const thisinh = m['thisinh'];
          m['_thisinh_ten'] = thisinh ? thisinh['ten'] : '';
          return m;
        })
        this.thptThisinh = this.sortByFirstLetterAlternate(dataThisinhdanhky);
        this.checkThiSinh();
        this.notifi.isProcessing(false);
      }, error: () => {
        this.notifi.isProcessing(false);
      }
    })
  }

  checkThiSinh() {
    if (this.formSave.valid) {
      const monSelect = this.f['monthi'].value;
      const typeSelect = this.f['type_sapxep'].value;
      let check: boolean = true;
      this.modalService.open(this.templateWaiting, WAITING_POPUP);
      monSelect.forEach(item => {
        let sobaodanh_index = 1;
        const thisinh = this.thptThisinh.filter(f => f['_monthi_ids'].includes(item));
        const phongthi = this.taoSoPhong(this.dataPhongThi, thisinh, typeSelect)
        if (phongthi.length > 0) {
          phongthi.forEach((phongthi, index) => {
            const phongthiNew: { id?: number, thisinh_ids: number[], monthi_ids: number[], ma_phongthi: string, ten_phongthi: string, hoidong_id: number, kehoach_id: number, sothisinh:number } = {
              kehoach_id: this.kehoach_id,
              hoidong_id: this.hoidong_id,
              monthi_ids: [].concat(item),
              sothisinh: phongthi.soluong,
              thisinh_ids: phongthi.thisinh_ids,
              ma_phongthi: this.dmMon.find(f => f.id === item).kyhieu + '.P' + '.' + (index + 1),
              ten_phongthi: this.dmMon.find(f => f.id === item).tenmon + "(Phòng " + (index + 1) + ', ' + this.f["ten_cathi"].value + ', ' + (this.dmMon.find(f => f.id === item).kyhieu + '.P' + '.' + (index + 1)) + '.' + this.kehoach_id + '.' + this.hoidong_id + ')',
            }

            this.notifi.isProcessing(true);
            this.hoidongPhongthiService.create(phongthiNew).subscribe({
              next: (id) => {
                check = true;
                phongthiNew.id = id;
                const thisinhids = phongthiNew.thisinh_ids;
                thisinhids.forEach(thisinhid => {
                  const newThiSinh = {
                    phongthi_id: phongthiNew.id,
                    kehoach_id: this.kehoach_id,
                    hoidong_id: this.hoidong_id,
                    sobaodanh: this.dmMon.find(f => f.id === item).kyhieu + '.' + sobaodanh_index,
                    thisinh_id: thisinhid
                  }
                  sobaodanh_index++;

                  this.phongthiThisinhService.create(newThiSinh).subscribe({
                    next: (id) => {
                      check = true;
                      this.notifi.isProcessing(false);

                    }, error: () => {
                      check = false;
                      this.notifi.isProcessing(false);
                    }
                  })
                })

              }, error: () => {
                this.notifi.isProcessing(false);
                check = false;

              }
            })

          });
        } else {


        }
      });
      this.modalService.dismissAll();
      if (check) {
        this.notifi.toastSuccess('Tạo phòng thi Thành công');
      } else {
        this.notifi.toastError("Tạo phong thi không thành công");
      }


    } else {
      this.notifi.toastError('Vui lòng kiểm tra lại thông tin nhập');
    }
  }

  taoSoPhong(dsPhong, dsThiSinh: ThptHoiDongThiSinh[], type: 'NN' | 'AZ') {
    // Tạo mảng phòng với số lượng thí sinh ban đầu là 0
    const phongCanThiet = dsPhong.map((phong, index) => ({ phongso: phong.phongso, soluong: phong.soluong, thisinh_ids: [] }));
    // Phân bổ thí sinh vào các phòng
    if (type === "NN") {
      let indexPhong = 0;
      for (let i = 0; i < dsThiSinh.length; i++) {
        const thiSinh = dsThiSinh[i];
        if (phongCanThiet[indexPhong].thisinh_ids.length >= phongCanThiet[indexPhong].soluong) {
          indexPhong++;
        }
        phongCanThiet[indexPhong].thisinh_ids.push(thiSinh.thisinh_id);
      }

      return phongCanThiet.filter(phong => phong.thisinh_ids.length > 0);

    }
    if (type === "AZ") {
      let indexPhong = 0;
      let thisinh_length = dsThiSinh.length;
      const dsPhongNew = []
      for (let item of phongCanThiet) {
        if (thisinh_length <= 0) break; // Điều kiện dừng

        dsPhongNew.push(item);
        thisinh_length -= item.soluong;
      }

      for (let i = 0; i < dsThiSinh.length; i++) {
        dsPhongNew[i % dsPhongNew.length].thisinh_ids.push(dsThiSinh[i].thisinh_id);
      }

      return dsPhongNew;
    }
  }


  sortByFirstLetterAlternate(arr: ThptHoiDongThiSinh[]) {
    if (arr.length <= 0) {
      return arr;
    } else {
      const sortedByFirstLetter = arr.sort((a, b) => {
        const nameA = a['_thisinh_ten'].charAt(0).toUpperCase();
        const nameB = b['_thisinh_ten'].charAt(0).toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
      return sortedByFirstLetter;
    }

  }

  loadDataPhongthi(kehoach_id: number, hoidong_id: number) {
    this.hoidongPhongthiService.getDataByKehoachIdAndHoidongId(kehoach_id, hoidong_id).subscribe({
      next: (data) => {
        this.TypeChangePage = 1;
        this.hoiDongPhongThi = data.map(m => {
          m['__monthi'] = m.monthi_ids.map(f => this.dmMon.find(c => c.id === f).tenmon).join(', ');
          return m;
        })


        this.notifi.isProcessing(false);
      }, error: () => {
        this.TypeChangePage = 0;
        this.notifi.isProcessing(false);
        this.notifi.toastWarning('Load dữ liệu không thành công');
      }
    })

  }
}
