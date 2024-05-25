import {Component, OnInit} from '@angular/core';
import {ThisinhInfoService} from "@shared/services/thisinh-info.service";
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {DanhMucToHopMonService} from "@shared/services/danh-muc-to-hop-mon.service";
import {forkJoin} from "rxjs";
import {AuthService} from "@core/services/auth.service";
import {ThiSinhInfo} from "@shared/models/thi-sinh";
import {DmMon, DmToHopMon} from "@shared/models/danh-muc";
import {NotificationService} from "@core/services/notification.service";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {KeHoachThi, ThptKehoachThiService} from "@shared/services/thpt-kehoach-thi.service";
import {Options, ThptOptionsService} from "@shared/services/thpt-options.service";
import {ThptOrderMonhocService} from "@shared/services/thpt-order-monhoc.service";
import {OrdersTHPT, ThptOrdersService} from "@shared/services/thpt-orders.service";
import {ActivatedRoute, Router} from "@angular/router";
import {SenderEmailService} from "@shared/services/sender-email.service";
import {HelperService} from "@core/services/helper.service";
import {HtmlToPdfService} from "@shared/services/html-to-pdf.service";

export interface SumMonThi {
  tenmon: number,
  total: number,
}

@Component({
  selector: 'app-thi-sinh-dang-ky',
  templateUrl: './thi-sinh-dang-ky.component.html',
  styleUrls: ['./thi-sinh-dang-ky.component.css']
})
export class ThiSinhDangKyComponent implements OnInit {
  ngType: 1 | 0 | -1 = 0;//0: form,1:thanh toasn thanh coong, -1:chờ thanh toán,
  isLoading: boolean = true;
  loadInitFail = false;
  dotthi_id_select: number = 0;
  mon_ids_select: number[] = [];
  userInfo: ThiSinhInfo;
  dmMon: DmMon[];
  dmToHopMon: DmToHopMon[];
  keHoachThi: KeHoachThi[];
  keHoachThi_dangky:KeHoachThi[];
  private _user_id: number;
  formSave: FormGroup;
  totalDangkyMonThi: SumMonThi[];
  dataOrders: OrdersTHPT[];
  listStyle = [
    {
      value: 1, title: '<div class="thanh-toan-check true text-center"><div></div><label>Đăng ký thành công</label></div>',
    },
    {
      value: 0, title: '<div class="thanh-toan-check false text-center"><div></div><label>Chưa thanh toán</label></div>',
    },
    {
      value: -1, title: '<div class="thanh-toan-check check text-center"><div></div><label>Đã thanh toán, chờ duyệt</label></div>',
    },
    {
      value: 2, title: '<div class="thanh-toan-check check text-center"><div></div><label>Đang thực hiện thanh toán</label></div>',
    }
  ]


  hinhthucthiSlect: 0 | 1 | -1 = 0;//0:mon//1:tohopmon
  dataTohopmonslect: DmToHopMon[];
  dataMonslect: DmMon[];
  lephithiData: Options;

  displayMaximizable: boolean = false;
  content_pay: string = '';
  orderParram: OrdersTHPT;
  activeIndex1: number = 0;

  constructor(
    private thisinhInfoService: ThisinhInfoService,
    private monService: DanhMucMonService,
    private toHopMonService: DanhMucToHopMonService,
    private kehoachThiService: ThptKehoachThiService,
    private auth: AuthService,
    private notifi: NotificationService,
    private fb: FormBuilder,
    private lephithi: ThptOptionsService,
    private orderMonhocService: ThptOrderMonhocService,
    private ordersService: ThptOrdersService,
    private router: Router,
    private activeRouter: ActivatedRoute,
    private senderEmailService: SenderEmailService,
    private helperService:HelperService,
    private htmlToPdfService:HtmlToPdfService
  ) {
    this._user_id = this.auth.user.id;
    this.formSave = this.fb.group({
      user_id: [null],
      kehoach_id: [null, Validators.required],
      mon_ids: [[], Validators.required],
      tohopmon_ids: [null],
    })
  }

  ngOnInit(): void {

    this.activeRouter.queryParams.subscribe(params => {
      const queryString = this.createQueryString(params);
      if (queryString) {
        this.checkCodeParram('?' + queryString);
      }
    });
    this.loadInit();
  }

  createQueryString(params: any): string {
    let queryString = '';
    Object.keys(params).forEach(key => {
      if (queryString !== '') {
        queryString += '&';
      }
      queryString += `${key}=${encodeURIComponent(params[key])}`;
    });
    return queryString;
  }

  loadInit() {
    this.dotthi_id_select = 0;
    this.getDataDanhMuc();
  }

  getDataOrder() {
    this.ordersService.getDataByIdthisinh(this.userInfo.id).subscribe({
      next: (data) => {
        let i = 1;
        this.dataOrders = data.map(m => {
          m['_indexTable'] = i++;
          m['__kehoach_thi'] = this.keHoachThi && this.keHoachThi.find(f => f.id === m.kehoach_id).dotthi ? this.keHoachThi.find(f => f.id === m.kehoach_id).dotthi : '';
          m['__lephithi_covered'] = m.lephithi;

          m['__status_converted'] =m.trangthai_thanhtoan === 1 ? this.listStyle.find(f => f.value === 1).title : (m.trangthai_thanhtoan === 0 && m.trangthai_chuyenkhoan === 0 ? this.listStyle.find(f => f.value === 0).title : (m.trangthai_thanhtoan=== 0 && m.trangthai_chuyenkhoan === 1 ? this.listStyle.find(f => f.value === -1).title :(m.trangthai_thanhtoan=== 2 ? this.listStyle.find(f => f.value === 2).title : '' ) ));
          m['__monthi_covered'] = this.dmMon ? m.mon_id.map(b => this.dmMon.find(f => f.id == b) ? this.dmMon.find(f => f.id == b) : []) : [];
          return m;
        });

        this.notifi.isProcessing(false);
      },
      error: () => {
        this.notifi.isProcessing(false);
        this.notifi.toastError('Không load được dữ liệu');
      }
    })
  }

  getDataDanhMuc() {
    this.isLoading = true;
    this.notifi.isProcessing(true);
    forkJoin<[ThiSinhInfo, DmMon[], DmToHopMon[], KeHoachThi[], Options,]>(
      [
        this.thisinhInfoService.getUserInfo(this._user_id),
        this.monService.getDataUnlimit(),
        this.toHopMonService.getDataUnlimit(),
        this.kehoachThiService.getDataUnlimit(),
        this.lephithi.getdata()

      ]
    ).subscribe({
      next: ([thisinhInfo, dmMon, dmtohopmon, keHoachThi, options,]) => {
        const date = new Date();
        this.userInfo = thisinhInfo;
        this.dmMon = dmMon;
        this.dmToHopMon = dmtohopmon.map(m => {
          let mon_ids_covered: string[] = [];
          m.mon_ids.forEach(f => {
            const name = this.dmMon && this.dmMon.find(a => a.id === f) ? this.dmMon.find(a => a.id === f).tenmon : '';
            mon_ids_covered.push(name);
          })
          m['__mon_ids_covered'] = mon_ids_covered ? mon_ids_covered : null;
          m['__tentohop_covered'] = mon_ids_covered ? m.tentohop + '(' + mon_ids_covered.join(', ') + ' )' : null;
          return m;
        })
        const curentDate = new Date();
        this.keHoachThi_dangky = keHoachThi.filter(f=> (this.helperService.formatSQLDate(new Date(f.ngayketthuc))) >= this.helperService.formatSQLDate(curentDate));
        this.keHoachThi = keHoachThi;
        this.lephithiData = options;
        this.lephithiData['_value_coverted'] = options.value.toLocaleString('vi-VN', {style: 'currency', currency: 'VND'});
        if (this.userInfo) {
          this.getDataOrder();
        }
        this.notifi.isProcessing(false);
        this.isLoading = false;

      }, error: () => {
        this.notifi.toastError('Mất kết nối với máy chủ');
        this.notifi.isProcessing(false);
        this.isLoading = false;

      }
    })
  }

  selectTypeMon(type: 1 | 0, event) {
    if (type === 1) {
      const id = event.value;
      this.dataTohopmonslect = this.dmToHopMon.filter(f => f.id === id);
    } else {
      const ids = event.map(m => {
        return this.dmMon.find(f => f.id === m);
      })
      this.dataMonslect = ids;
    }
  }

  resetForm() {
    this.formSave.reset({
      user_id: null,
      kehoach_id: null,
      mon_ids: [],
      tohopmon_ids: [null],
    })
  }

  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }

  SaveForm() {
    this.isLoading=true;

    const kehoachid = this.f['kehoach_id'].value;
    if (this.formSave.valid) {
      this.dataMonSelect = []
      this.mon_ids_select = [];
      const kehoach_id = this.dotthi_id_select;
      this.dotthi_id_select = 0;
      const monIds_select = this.hinhthucthiSlect === 0 ? this.f['mon_ids'].value : this.dmToHopMon.find(f => f.id === this.f['tohopmon_ids'].value).mon_ids;
      let listMon_ids: number[] = [];
      this.dataOrders.filter(f=>f.kehoach_id === kehoach_id).forEach(f => {
        listMon_ids = listMon_ids.concat(f.mon_id);
      });
      listMon_ids = [...new Set(listMon_ids)];
      const check = !monIds_select.some(element => listMon_ids.includes(element));

      if (monIds_select.length > 0) {
        if (check) {
          const formUp: FormGroup = this.fb.group({
            thisinh_id: this.userInfo.id,
            kehoach_id: kehoachid,
            mota: '',
            lephithi: null,
            status: null,
            tohop_mon_id: null,
            mon_id: null,
          });
          formUp.reset({
            thisinh_id: this.userInfo.id,
            kehoach_id: kehoachid,
            mota: '',
            lephithi: this.hinhthucthiSlect === 0 ? this.lephithiData.value * this.dataMonslect.length : this.lephithiData.value * this.dataTohopmonslect[0].mon_ids.length,
            status: 1,
            tohop_mon_id: this.hinhthucthiSlect === 1 ? this.f['tohopmon_ids'].value : null,
            mon_id: this.hinhthucthiSlect === 0 ? this.f['mon_ids'].value : this.dmToHopMon.find(f => f.id === this.f['tohopmon_ids'].value).mon_ids,
          });
          this.notifi.isProcessing(true);
          this.ordersService.create(formUp.value).subscribe({
            next: async (id) => {
              const order = {
                id: id,
                thisinh_id: this.userInfo.id,
                kehoach_id: kehoachid,
                mota: '',
                lephithi: this.hinhthucthiSlect === 0 ? this.lephithiData.value * this.dataMonslect.length : this.lephithiData.value * this.dataTohopmonslect[0].mon_ids.length,
                status: 1,
                tohop_mon_id: this.hinhthucthiSlect === 1 ? this.f['tohopmon_ids'].value : null,
                mon_id: this.hinhthucthiSlect === 0 ? this.f['mon_ids'].value : this.dmToHopMon.find(f => f.id === this.f['tohopmon_ids'].value).mon_ids,
              }
              this.notifi.isProcessing(false);
              this.notifi.toastSuccess('Thí sinh đăng ký thành công');
              this.sendEmail(this.userInfo, order);
              this.loadInit();
              this.resetForm();
              this.isLoading=false;
            },
            error: () => {
              this.isLoading=false;
              this.notifi.toastError('Thí sinh đăng ký thất bại');
              this.notifi.isProcessing(false);
            }
          })
        } else {
          this.notifi.toastError('Môn bạn chọn đã được đăng ký,vui lòng kiểm tra lại.');
          this.isLoading=false;

        }
      } else {
        this.notifi.toastError('Bạn chưa chọn môn thi');
        this.isLoading=false;

      }
    } else {
      this.notifi.toastError('Vui lòng chọn đủ thông tin');
      this.isLoading=false;
    }
  }

  getPayment(item: OrdersTHPT) {
    const kehoachSelect = this.keHoachThi.find(f=>f.id === item.kehoach_id)
    if( this.helperService.formatSQLDate(new Date())  <= this.helperService.formatSQLDate(new Date(kehoachSelect.ngayketthuc)) ){
      const fullUrl: string = `${location.origin}${this.router.serializeUrl(this.router.createUrlTree(['admin/thi-sinh/dang-ky/']))}`;
      const content = 'VSAT' + item.id;
      this.ordersService.getPayment(item.id, fullUrl,content).subscribe({
        next: (data) => {
          window.location.assign(data);
          this.ngType = 0;
          this.notifi.isProcessing(false);
        }, error: () => {
          this.notifi.isProcessing(false);
        }
      })
    }else{
      this.notifi.toastError('Đã hết thời hạn đăng ký môn trong đợt thi này');
    }
  }

  checkCodeParram(text: string) {
    this.notifi.isProcessing(true);
    this.ordersService.checkPaymentByUser(text).subscribe({
      next: () => {
        this.ngType = 1;
        this.notifi.isProcessing(false);
      },
      error: () => {
        this.ngType = -1;
        this.notifi.isProcessing(false);
        this.notifi.toastError('Bạn chưa thanh toán!');
      },
    })
  }

  btnchecksite() {
    this.ngType = 0;
    this.router.navigate(['admin/thi-sinh/dang-ky/']);
    this.loadInit();
  }

  returnInfo() {
    this.router.navigate(['admin/thi-sinh/thong-tin/']);
  }

  async deleteRow(id: number) {
    const confirm = await this.notifi.confirmDelete();
    if (confirm) {
      this.ordersService.delete(id).subscribe({
        next: () => {
          this.getDataOrder();
          this.notifi.isProcessing(false);
          this.notifi.toastSuccess('Thao tác thành công');
        }, error: () => {
          this.notifi.isProcessing(false);
          this.notifi.toastError('Thao tác không thành công');
        }
      })
    }
  }

  dataMonSelect: DmMon[] = [];

  selectDothi(item: KeHoachThi) {
    this.dotthi_id_select = item.id;
    this.f['kehoach_id'].setValue(this.dotthi_id_select);
    this.notifi.isProcessing(true);
    this.orderMonhocService.getDataMonSelect().subscribe({
      next: (data) => {
        this.totalDangkyMonThi = data;
        this.dataMonSelect = this.dmMon.map(m => {
          const check = this.totalDangkyMonThi.find(t => t.tenmon === m.id) ? this.totalDangkyMonThi.find(t => t.tenmon === m.id).total : 0;
          const total_remaining = (item.soluong_toida - check) < 0 ? 0 : (item.soluong_toida - check);
          // m['_total_dangky'] = 0;
          m['_total_dangky'] = total_remaining;
          m['__tenmon_coverted'] = m.tenmon + ' [' + total_remaining + ']';
          return m;
        }).filter(f => f['_total_dangky'] > 0);
        this.notifi.isProcessing(false);
      },
      error: () => {
        this.notifi.isProcessing(false);
      }
    })
  }

  selectMonOfDmMon(item: DmMon) {
    const monselect = !this.mon_ids_select.find(f => f === item.id) ? [].concat(this.mon_ids_select, item.id) : this.mon_ids_select.filter(f => f !== item.id);
    this.mon_ids_select = monselect;

    this.f['mon_ids'].setValue(this.mon_ids_select);
    this.selectTypeMon(0, this.mon_ids_select);
  }

  sendEmail(user, order) {

    let message = `

        <p>Bạn đã đăng ký thi Bài thi đánh giá đầu vào đại học bằng hinh thức thi trên máy tính của Đại học Thái Nguyên (V-SAT-TNU):</p>

        <p style="font-weight:700;">THÔNG TIN ĐĂNG KÝ:</p>
        <table width="100%" style="border:0;">
            <tr>
                <td style="width:100px;">Họ và tên:</td>
                <td style="font-weight:600">${user.hoten}</td>
            </tr>
            <tr>
                <td style="width:100px;">Ngày sinh:</td>
                <td style="font-weight:600">${user.ngaysinh}</td>
            </tr>
            <tr>
                <td style="width:100px;">Giới tính:</td>
                <td style="font-weight:600">${user.gioitinh === 'nam' ? "Nam" : 'Nữ'}</td>
            </tr>
            <tr>
                <td style="width:100px;">Nơi sinh:</td>
                <td style="font-weight:600">${user.noisinh}</td>
            </tr>
            <tr>
                <td style="width:100px;">Số CCCD:</td>
                <td style="font-weight:600">${user.cccd_so}</td>
            </tr>
            <tr>
                <td style="width:100px;">Ngày cấp:</td>
                <td style="font-weight:600">${user.cccd_ngaycap}</td>
            </tr>
            <tr>
                <td style="width:100px;">Nơi cấp:</td>
                <td style="font-weight:600">${user.cccd_noicap ? user.cccd_noicap :'Không xác định'}</td>
            </tr>
        </table>

        <p>CÁC MÔN ĐÃ ĐĂNG KÝ</p>
        <table style=" border: 1px solid black;border-collapse: collapse;">
          <tr style="border: 1px solid black;border-collapse: collapse;">
            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="50px"><strong>STT</strong></th>
            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="150px"><strong>Môn thi</strong></th>
            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="150px"><strong>Đơn giá </strong></th>
          </tr>
    `;
    const ordermon_ids = order.mon_id;
    ordermon_ids.forEach((i, index) => {
      const mon = this.dmMon.find(f => f.id === i);
      if (mon) {
        message += `
      <tr style="border: 1px solid black;border-collapse: collapse;">
        <td style="border: 1px solid black;border-collapse: collapse; text-align:center;">${index + 1}</td>
        <td style="border: 1px solid black;border-collapse: collapse;">${mon.tenmon}</td>
        <td style="border: 1px solid black;border-collapse: collapse; text-align:right;">${ parseInt(String(this.lephithiData.value)).toLocaleString('vi-VN', {style: 'currency', currency: 'VND'})}</td>
      </tr>
    `;
      }
    });
    message += `
  <tr>
    <th colspan="2" style="border: 1px solid black;border-collapse: collapse;"><strong>Tổng (VNĐ)</strong></th>
    <td style="border: 1px solid black;border-collapse: collapse;text-align:right;"><strong> ${order.lephithi.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND'
    })}</strong></td>
  </tr>
    </table>
    <p style="color: #ce3b04;">- Trạng thái thanh toán: Chưa thanh toán.</p>
    <p>- Bạn vui lòng thanh toán lệ phí thi để hoàn tất quá trình đăng ký thi.</p>
`;
    const emailsend:any = {
      to: this.auth.user.email,
      title: ' Email thông báo đăng ký thành công',
      message: message
    }
    this.notifi.isProcessing(true)
    this.senderEmailService.sendEmail(emailsend).subscribe({
      next: () => {
        this.notifi.isProcessing(false)
        this.notifi.toastSuccess("Hệ thống gửi Email đăng ký thi thành công.");
      }, error: () => {
        this.notifi.isProcessing(false)
        this.notifi.toastError('Hệ thống gửi Email đăng ký không thành công');
      }
    })
  }


  btnThanhToan(item: OrdersTHPT) {
    this.displayMaximizable = true;
    this.content_pay = 'VSAT' + item.id;
    this.orderParram = item;
  }

  btnGetPay() {

    if (this.orderParram !== null) {
      this.getPayment(this.orderParram);
    }
  }

  btnCheckChuyenkhoan() {
    this.notifi.isProcessing(true)
    this.ordersService.update(this.orderParram.id, {trangthai_chuyenkhoan: 1}).subscribe({
      next: () => {
        this.displayMaximizable = false;
        this.loadInit();
        this.notifi.isProcessing(false);
        this.notifi.toastSuccess('Chúng tôi đã ghi nhận trạng thái thanh toán của bạn, chúng tôi sẽ kiểm tra thanh toán và phản hồi cho bạn trong vòng 24h.');

      }, error: () => {
        this.notifi.isProcessing(false);
        this.notifi.toastSuccess('Thao tác không thành công');
      }
    })
  }
  isScrollEnabled: boolean =false

  btnEpostPDF(item){
    const textHTml =`<p style="width:100%; font-family: Arial;">Trần Minh Long</p>`;
    this.htmlToPdfService.textHtmlToWord(textHTml, 'phiếu dự thi');
  }

}

