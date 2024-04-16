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
import { ThptOrdersService } from "@shared/services/thpt-orders.service";
import { forkJoin, switchMap } from 'rxjs';
import { AbstractControl, FormBuilder, FormGroup } from "@angular/forms";
import { ThptHoiDongPhongThi, ThptHoiDongThiSinh } from "@shared/models/thpt-model";
import { ThptHoidongPhongthiService } from "@shared/services/thpt-hoidong-phongthi.service";
import { ThptHoidongThisinhService } from '@modules/shared/services/thpt-hoidong-thisinh.service';
import { Paginator } from "primeng/paginator";
import { NgPaginateEvent } from "@shared/models/ovic-models";
import { ExpostExcelPhongthiThisinhService } from '@modules/shared/services/expost-excel-phongthi-thisinh.service';
import { take } from 'rxjs/operators';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { WAITING_POPUP } from "@shared/utils/syscat";
import { SenderEmailService } from '@modules/shared/services/sender-email.service';
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
  TypeChangePage: 0 | 1 | 2 | 3 = 0; // 0: not data room//1:have data room //3:showDataroom

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
  constructor(
    private themeSettingsService: ThemeSettingsService,
    private hoiDongService: ThptHoiDongService,
    private notifi: NotificationService,
    private monService: DanhMucMonService,
    private tohopmonService: DanhMucToHopMonService,
    private kehoachThiService: ThptKehoachThiService,
    private orderService: ThptOrdersService,
    private orderMonHocService: ThptOrderMonhocService,
    private fb: FormBuilder,
    private hoidongPhongthiService: ThptHoidongPhongthiService,
    private hoidongThisinhService: ThptHoidongThisinhService,
    private exportExcelService: ExpostExcelPhongthiThisinhService,
    private modalService: NgbModal,
    private senderEmailService: SenderEmailService
  ) {
    this.formSave = this.fb.group({
      hoidong_id: [this.hoidong_id],
      kehoach_id: [this.kehoach_id],
      monthi: [null],
      soluong_thisinh: [null],
      soluong_phongthi: [null]
    })
    this.formPhongthi = this.fb.group({
      kehoach_id: [null],
      hoidong_id: [null],
      mota: [""],
      sothisinh: [null],
      canbo_coithi: [''],
      ma_phongthi: [''],
      ten_phongthi: ['']
    })

  }


  ngOnInit(): void {
    if (this.hoidong_id) {
      this.loadInit();
    }
  }

  loadInit() {
    this.notifi.isProcessing(true);

    this.hoiDongService.getHoidongonly(this.hoidong_id).subscribe({
      next: (data) => {
        this.hoiDongData = data;
        console.log(this.hoiDongData);

        this.loadDmData(data.id);
        this.notifi.isProcessing(false);
      }, error: (err) => {
        this.notifi.isProcessing(false);
        this.notifi.toastError('Mất kết nối với máy chủ');
      }
    })
  }


  loadDmData(kehoach_id: number) {
    this.notifi.isProcessing(true);
    forkJoin<[DmMon[], DmToHopMon[], KeHoachThi]>([
      this.monService.getDataUnlimit(),
      this.tohopmonService.getDataUnlimit(),
      this.kehoachThiService.getDataById(kehoach_id),

    ]).subscribe({
      next: ([mon, tohopmon, kehoachthi]) => {
        this.dmMon = mon;
        this.dmToHopMon = tohopmon;
        this.keHoachThi = kehoachthi;

        this.loadDataPhongthi(this.kehoach_id, this.hoidong_id);
        this.notifi.isProcessing(false);
      }, error: (e) => {
        this.notifi.toastError('Mất kết nối với máy chủ');
        this.notifi.isProcessing(false);
      }
    })
  }
  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }


  checkThisinh() {
    const tenmon = this.f['monthi'].value;
    console.log(tenmon);

    if (tenmon) {
      this.loadingBtn = true;
      this.notifi.isProcessing(true);
      const kehoach_id = this.kehoach_id;
      this.orderService.getDataByKehoachIdAndStatus(kehoach_id).pipe(switchMap(m => {
        console.log(m);
        const ids = m.map(c => c.id.toString());
        console.log(ids);

        return forkJoin([of(m), this.orderMonHocService.getDataByKehoachIdAndOrderIds(ids, this.kehoach_id)]);
      })).subscribe({
        next: ([data1, data2]) => {
          console.log(data2);

          const data = data2.filter(f => tenmon.includes(f.tenmon)).map(m => {
            const thisinh = m['thisinh'];
            m['_thisinh_ten'] = thisinh ? thisinh['ten'] : '';
            return m
          });

          // this.thisinhOrder = this.sortByFirstLetterAlternate(data);
          this.thisinhOrder = this.collectData(data);
          console.log(this.thisinhOrder);
          this.notifi.toastSuccess('load dữ liệu thành công!');
          this.loadingBtn = false;

        }, error: (e) => {
          console.log(e);
          this.loadingBtn = false;
          this.notifi.isProcessing(false);
          this.notifi.toastError('load dữ liệu không thành công');
        }
      })
    } else {
      this.notifi.toastWarning('Vui lòng chọn môn học');
    }


  }



  sortByFirstLetterAlternate(arr: OrdersMonhocTHPT[]) {
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

  collectData(data: OrdersMonhocTHPT[]) {
    const uniqueObjects = data.reduce((acc, obj) => {
      if (!acc.find(item => item.order_id === obj.order_id)) {
        acc.push(obj);
      }
      return acc;
    }, []);
    // return uniqueObjects;
    if (uniqueObjects.length <= 0) {
      return uniqueObjects;
    } else {
      const sortedByFirstLetter = uniqueObjects.sort((a, b) => {
        const nameA = a['_thisinh_ten'].charAt(0).toUpperCase();
        const nameB = b['_thisinh_ten'].charAt(0).toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
      return sortedByFirstLetter;
    }


  }


  CreateRooms() {
    const soluong_thisinh_1phong = this.f['soluong_thisinh'].value;
    const soluong_thisinh = this.thisinhOrder ? this.thisinhOrder.length : null;
    const monSelect = this.f['monthi'].value;

    if (this.thisinhOrder && soluong_thisinh_1phong) {
      if (soluong_thisinh < soluong_thisinh_1phong) {
        this.notifi.toastWarning('Số lượng thí sinh trên 1 phòng thi không phù hợp');
      }
      else {
        this.notifi.toastSuccess('Số lượng thí sinh phù hợp');
        this.createdDatasRoom(this.thisinhOrder, soluong_thisinh_1phong, monSelect)
      }

    } else {
      this.notifi.toastWarning('Bạn chưa kiểm tra số lượng thi sinh đăng ký hoặc chưa nhập số lượng thí sinh trên 1 phòng');
    }
  }

  room: ThptHoiDongPhongThi[];

  createdDatasRoom(thisinh: OrdersMonhocTHPT[], numofRooms: number, monSelect: number[]) {


    const monSelecttoString = monSelect.map(m => this.dmMon.find(f => f.id === m).tenmon).join(', ');
    const rooms: ThptHoiDongPhongThi[] = [];
    for (let i = 1; i <= numofRooms; i++) {
      const index = i < 10 ? '00' + i : i >= 10 && i < 100 ? '0' + i : i;
      const item: ThptHoiDongPhongThi = {
        ten_phongthi: 'Phòng thi' + i + '(' + 'Môn thi: ' + monSelecttoString + ')' + '(P' + index + '.' + this.kehoach_id + '.' + this.hoidong_id + ')',
        kehoach_id: this.kehoach_id,
        status: 1,
        mota: '',
        hoidong_id: this.hoidong_id,
        sothisinh: 0,
        canbo_coithi: '',
        thisinh_ids: [],
        monthi_ids: monSelect,
        ma_phongthi: 'P' + index + '.' + this.kehoach_id + '.' + this.hoidong_id
      }
      rooms.push(item);
    }
    for (let i = 0; i < thisinh.length; i++) {
      rooms[i % rooms.length].thisinh_ids.push(thisinh[i].thisinh_id);
      rooms[i % rooms.length].sothisinh = rooms[i % rooms.length].thisinh_ids.length;
    }

    if (rooms) {
      rooms.forEach((e, index) => {
        setTimeout(() => {
          this.notifi.isProcessing(true);
          this.hoidongPhongthiService.create(e).subscribe({
            next: (id) => {
              e['id'] = id;
              console.log(e);
              this.createThisinhInPhongthi(e);
              this.notifi.toastSuccess('Tạo phòng thi thành công');
              this.notifi.isProcessing(false);
            }, error: () => {
              this.notifi.toastError('Tạo phòng thi không thành công');
              this.notifi.isProcessing(false);
            }
          })
        }, index * 1000);
      })
    }

  }


  createThisinhInPhongthi(phongthi: ThptHoiDongPhongThi) {
    const thisinhIds = phongthi.thisinh_ids;
    let i = 1;

    thisinhIds.forEach((item, index) => {
      const index_coverted = i < 10 ? '00' + i : i >= 10 && i < 100 ? '0' + i : i;
      const data: ThptHoiDongThiSinh = {
        hoidong_id: phongthi.hoidong_id,
        monthi_ids: phongthi.monthi_ids,
        phongthi_id: phongthi.id,
        thisinh_id: item,
        sobaodanh: phongthi.ma_phongthi + '.' + index_coverted
      }
      console.log(data);
      i++;

      setTimeout(() => {
        this.hoidongThisinhService.create(data).subscribe({
          next: (id) => {
            this.notifi.toastSuccess('Thành công');
          }, error: () => {
            this.notifi.toastError('Mất kết nối với máy chủ');
          }
        })
      }, index * 1000);
    });;

    this.loadDataPhongthi(this.kehoach_id, this.hoidong_id);

  }

  loadDataPhongthi(kehoach_id: number, hoidong_id: number) {
    this.hoidongPhongthiService.getDataByKehoachIdAndHoidongId(kehoach_id, hoidong_id).subscribe({
      next: (data) => {
        this.hoiDongPhongThi = data.map(m => {
          m['__monthi'] = m.monthi_ids.map(f => this.dmMon.find(c => c.id === f).tenmon).join(', ');
          return m;
        })
        console.log(this.hoiDongPhongThi);
        this.notifi.isProcessing(false);
      }, error: () => {
        this.notifi.isProcessing(false);
      }
    })
  }


  showThisinhInPhong(item: ThptHoiDongPhongThi) {
    this.notifi.isProcessing(true);
    this.formPhongthi.reset({
      kehoach_id: item.kehoach_id,
      hoidong_id: item.hoidong_id,
      mota: item.mota,
      sothisinh: item.sothisinh,
      canbo_coithi: item.canbo_coithi,
      ma_phongthi: item.ma_phongthi,
      ten_phongthi: item.ten_phongthi
    })
    this.hoiDongPhongThiSelect = item;
    this.getdataphongthithisisnh(1, item);
  }

  getdataphongthithisisnh(page, item: ThptHoiDongPhongThi) {
    this.hoidongThisinhService.getDataByPhongthiAndHoidongId(this.page, item.id, item.hoidong_id).subscribe({
      next: ({ recordsTotal, data }) => {
        console.log(data);
        this.recordsTotal = recordsTotal;
        this.TypeChangePage = 3;
        let index = 1;
        this.thptThisinh = data.map(m => {
          m['__stt'] = index++;
          const thisinh = m['thisinh'];
          m['__hoten'] = thisinh ? thisinh['hoten'] : '';
          m['__email'] = thisinh ? thisinh['email'] : '';
          m['__phone'] = thisinh ? thisinh['phone'] : '';
          m['__adress'] = thisinh ? thisinh['noisinh'] : '';
          m['__dob'] = thisinh ? thisinh['ngaysinh'] : '';
          m['__sex'] = thisinh && thisinh['gioitinh'] === 'nam' ? 'Nam' : 'Nữ';
          return m;
        });
        this.notifi.isProcessing(false);
      }, error: () => {
        this.notifi.isProcessing(false);
      }
    })
  }
  paginate({ page }: NgPaginateEvent) {
    this.page = page + 1;
    this.getdataphongthithisisnh(this.page, this.hoiDongPhongThiSelect);
  }

  returnPhongthi() {
    this.TypeChangePage = 0;
  }
  editDataPhongthi() {
    console.log(this.formPhongthi.value);
    this.notifi.isProcessing(true);
    this.hoidongPhongthiService.update(this.hoiDongPhongThiSelect.id, this.formPhongthi.value).subscribe({
      next: (data) => {
        this.notifi.isProcessing(false);
        this.notifi.toastSuccess('Cập nhật thành công');
        this.loadDataPhongthi(this.kehoach_id, this.hoidong_id);

      }, error: () => {
        this.notifi.isProcessing(false);
        this.notifi.toastError('Cập nhật không thành công !');
      }
    })
  }
  async deletePhongthi() {
    const confirm = await this.notifi.confirmDelete();
    if (confirm) {
      this.hoidongPhongthiService.delete(this.hoiDongPhongThiSelect.id).subscribe({
        next: () => {
          this.notifi.isProcessing(false);
          this.notifi.toastSuccess('Thao tác thành công');
          this.loadDataPhongthi(this.kehoach_id, this.hoidong_id);
          this.TypeChangePage = 0;
        }, error: () => {
          this.notifi.isProcessing(false);
          this.notifi.toastError('Thao tác không thành công');
        }
      })
    }
  }


  async expostExcelDataPhongThi() {
    if (this.hoiDongPhongThi) {
      this.modalService.open(this.templateWaiting, WAITING_POPUP);
      const hoidongPhongthiParams = this.hoiDongPhongThi;

      for (const f of hoidongPhongthiParams) {
        try {
          this.notifi.isProcessing(true);
          const data = await this.hoidongThisinhService.getDataByPhongthiAndHoidongIdnotPage(f.id, f.hoidong_id).toPromise();
          let index = 1;
          const newData = data.map(m => {
            const thisinh = m['thisinh'];
            index++
            return {
              __stt: index++,
              __sobaodanh: m.sobaodanh,
              __hoten: thisinh['hoten'],
              __sex: thisinh['gioitinh'] === 'nam' ? 'Nam' : 'Nữ',
              __dob: thisinh['ngaysinh'],
              __address: thisinh['noisinh'],
              __phone: thisinh['phone'],
              __email: thisinh['email'],
            };
          });
          f['_thisinh'] = newData;
          this.notifi.isProcessing(false);
        } catch (error) {
          console.error(error);
          this.notifi.isProcessing(false);
        }
        await this.delay(200).toPromise(); // Wait 200ms before next iteration
      }

      const repostheading = 'Danh sách thí sinh (' + this.keHoachThi.dotthi + ' )';
      console.log(hoidongPhongthiParams);

      this.exportExcelService.exportExcel(hoidongPhongthiParams, this.columns, this.keHoachThi.dotthi, repostheading)
      this.modalService.dismissAll();
    } else {
      this.notifi.toastError('Người dùng chưa tạo phòng thi!');
    }
  }

  columns = ['Stt', 'Số báo danh', 'Họ và tên', 'Giới tính', 'Ngày sinh', 'Nơi sinh', 'Số điện thoại', 'Email'];



  delay(ms: number): Observable<any> {
    return interval(ms).pipe(take(1));
  }


  async SendEmailToThisinh() {
    if (this.hoiDongPhongThi) {
      this.modalService.open(this.templateWaiting, WAITING_POPUP);
      const hoidongPhongthiParams = this.hoiDongPhongThi;

      for (const f of hoidongPhongthiParams) {
        try {
          this.notifi.isProcessing(true);
          const data = await this.hoidongThisinhService.getDataByPhongthiAndHoidongIdnotPage(f.id, f.hoidong_id).toPromise();
          let index = 1;
          const newData = data.map(m => {
            const thisinh = m['thisinh'];
            index++
            return {
              __stt: index++,
              __sobaodanh: m.sobaodanh,
              __hoten: thisinh['hoten'],
              __sex: thisinh['gioitinh'] === 'nam' ? 'Nam' : 'Nữ',
              __dob: thisinh['ngaysinh'],
              __address: thisinh['noisinh'],
              __phone: thisinh['phone'],
              __email: thisinh['email'],
            };
          });
          f['_thisinh'] = newData;

          newData.forEach(e => {
            const param = {
              title: "Thông báo thí sinh dự thi!",
              name: e.__email,
              to: e.__email,
              message: "<div><p> Xin chào " + e.__hoten + "!</p><p>Bạn đã đăng ký dự thi !</p><p>Phòng thi : " + f.ten_phongthi + "</p><p>Mã Phòng thi: " + f.ma_phongthi + "</p><p>Số báo danh :" + e.__sobaodanh + "</p></div>"
            }
            this.senderEmailService.sendEmail(param).subscribe();
          })
          this.notifi.isProcessing(false);
        } catch (e) {

          this.notifi.isProcessing(false);
        }


        await this.delay(200).toPromise(); // Wait 200ms before next iteration
      }
      this.modalService.dismissAll();
      this.notifi.toastSuccess('Hệ thống gửi email cho thí sinh thành công!');
    } else {
      this.notifi.toastError('Người dùng chưa tạo phòng thi!');
    }
  }
}
