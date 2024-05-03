import { Component, OnInit } from '@angular/core';
import { ThisinhInfoService } from "@shared/services/thisinh-info.service";
import { DanhMucMonService } from "@shared/services/danh-muc-mon.service";
import { DanhMucToHopMonService } from "@shared/services/danh-muc-to-hop-mon.service";
import { forkJoin } from "rxjs";
import { AuthService } from "@core/services/auth.service";
import { ThiSinhInfo } from "@shared/models/thi-sinh";
import { DmMon, DmToHopMon, KieuDuLieuNguLieu } from "@shared/models/danh-muc";
import { NotificationService } from "@core/services/notification.service";
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { KeHoachThi, ThptKehoachThiService } from "@shared/services/thpt-kehoach-thi.service";
import { Options, ThptOptionsService } from "@shared/services/thpt-options.service";
import {OrdersMonhocTHPT, ThptOrderMonhocService} from "@shared/services/thpt-order-monhoc.service";
import { OrdersTHPT, ThptOrdersService } from "@shared/services/thpt-orders.service";
import { ActivatedRoute, Router } from "@angular/router";
import {OvicEmailObject, SenderEmailService} from "@shared/services/sender-email.service";
import {Auth} from "@core/models/auth";

export interface SumMonThi {
  tenmon:number,
  total:number,
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
  dotthi_id_select :number =0;
  mon_ids_select :number[] = [];
  userInfo: ThiSinhInfo;
  dmMon: DmMon[];
  dmToHopMon: DmToHopMon[];
  keHoachThi: KeHoachThi[];
  private _user_id: number;
  formSave: FormGroup;
  totalDangkyMonThi:SumMonThi[];
  dataOrders: OrdersTHPT[];
  listStyle = [
    {
      value: 1, title: '<div class="thanh-toan true"><div></div><label> Đã thanh toán</label></div>',
    },
    {
      value: 0, title: '<div class="thanh-toan false"><div></div><label> Chưa thanh toán</label></div>',
    }
  ]
  hinhthucthi = [
    { label: 'Từng môn', value: 0 },
    { label: 'Tổ hợp Môn', value: 1 },
  ];

  noicapdata = [
    { title: 'Cục quản lý hành chính về TTXH', code: '1' },
  ]
  hinhthucthiSlect: 0 | 1 | -1 = 0;//0:mon//1:tohopmon
  dataTohopmonslect: DmToHopMon[];
  dataMonslect: DmMon[];
  lephithiData: Options;
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
    private senderEmailService:SenderEmailService,

  ) {
    this._user_id = this.auth.user.id;
    this.formSave = this.fb.group({
      user_id: [null],
      kehoach_id: [null, Validators.required],
      // hinhthucthi:[null,Validators.required], //1:tohopmon,2:mon thi,
      mon_ids: [[]],
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
    this.getDataDanhMuc();
  }

  getDataOrder() {
    this.ordersService.getDataByIdthisinh(this.userInfo.id).subscribe({
      next: (data) => {
        let i = 1;
        this.dataOrders = data.map(m => {
          const monhoc = m['monhoc'].map(m => {
            return { tohopmon: this.dmToHopMon.find(f => f.id === m['tohop_monhoc']) ? this.dmToHopMon.find(f => f.id === m['tohop_monhoc'])['__tentohop_covered'] : null, tenmon: m['tenmon'] };
          });
          const uniqueTohop = this.uniqueTohop(monhoc);
          m['_indexTable'] = i++;
          m['__kehoach_thi'] = this.keHoachThi && this.keHoachThi.find(f => f.id === m.kehoach_id).dotthi ? this.keHoachThi.find(f => f.id === m.kehoach_id).dotthi : '';
          m['__lephithi_covered'] = m.lephithi + ' VNĐ';
          m['__status_converted'] = m['trangthai_thanhtoan'] === 1 ? this.listStyle.find(f => f.value === 1).title : this.listStyle.find(f => f.value === 0).title;
          console.log()
          m['__monthi_covered'] =this.dmMon ? m.mon_id.map(b=> this.dmMon.find(f=>f.id ==b )?  this.dmMon.find(f=>f.id ==b ).tenmon :'').join(', ') : '';
          // if (uniqueTohop) {

            // m['__monthi_covered'] = uniqueTohop && uniqueTohop[0]['tohopmon'] !== null ? uniqueTohop[0]['tohopmon'] : uniqueTohop.map(c => this.dmMon.find(v => v.id === parseInt(c['tenmon'])).tenmon).join(', ');
          // }
          return m;
        });
        this.notifi.isProcessing(false);
      },
      error: (e) => {
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
      next: ([thisinhInfo, dmMon, dmtohopmon, keHoachThi, options, ]) => {

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
        this.keHoachThi = keHoachThi;
        this.lephithiData = options;
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
      const tohopmomselect = this.dmToHopMon.filter(f => f.id === id);
      this.dataTohopmonslect = tohopmomselect;
    }
    else {
      const ids = event.map(m => {
        const check = this.dmMon.find(f => f.id === m);
        return check;
      })
      this.dataMonslect = ids;
    }
  }



  valueHinhthucThi(event) {
    this.hinhthucthiSlect = event.value;
  }
  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }
  reLoadData() {

  }
  SaveForm() {
    const kehoachid = this.f['kehoach_id'].value;
    if (this.formSave.valid) {
      this.dataMonSelect = []
      this.dotthi_id_select = 0;
      this.mon_ids_select = []
      const monIds_select = this.hinhthucthiSlect === 0 ? this.f['mon_ids'].value : this.dmToHopMon.find(f => f.id === this.f['tohopmon_ids'].value).mon_ids;
      let listMon_ids: number[] = [];
      this.dataOrders.forEach(f => {
        listMon_ids = listMon_ids.concat(f.mon_id);
      });

      listMon_ids = [...new Set(listMon_ids)];
      if (!monIds_select.some(element => listMon_ids.includes(element))) {
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
        this.ordersService.create(formUp.value).subscribe({
          next: async (id) => {
            // await this.UpOrderMonBylocal(id, this.userInfo.id, kehoachid, this.hinhthucthiSlect);
            const order  = {
              id : id,
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
            this.sendEmail(this.userInfo,order);
            this.loadInit();
          },
          error: (e) => {
            this.notifi.toastError('Thí sinh đăng ký thất bại');
            this.notifi.isProcessing(false);
          }
        })

      } else {
        this.notifi.toastError('Môn bạn chọn đã được đăng ký,vui lòng kiểm tra lại.');
      }


    } else {
      this.notifi.toastError('Vui lòng chọn đủ thông tin');
    }
  }


  UpOrderMonBylocal(order_id: number, thisinh_id: number, kehoach_id: number, hinhthucthi: number) {
    const formUp: FormGroup = this.fb.group({
      order_id: null,
      thisinh_id: this.userInfo.id,
      kehoach_id: null,
      tohop_monhoc: null,
      tenmon: null,
      lephithi: null,
    });

    if (hinhthucthi === 1) {
      if (this.dataTohopmonslect) {
        this.dataTohopmonslect[0].mon_ids.forEach((f, index) => {
          this.notifi.isProcessing(true);
          setTimeout(() => {
            const monselect = this.dmMon.find(a => a.id === f);
            formUp.reset({
              order_id: order_id,
              thisinh_id: thisinh_id,
              kehoach_id: kehoach_id,
              tohop_monhoc: this.dataTohopmonslect[0].id,
              tenmon: monselect ? monselect.id : f,
              lephithi: this.lephithiData.value
            });
            this.orderMonhocService.create(formUp.value).subscribe({
              next: () => {
                this.notifi.isProcessing(false);
              },
              error: () => {
                this.notifi.isProcessing(false);
              }
            })
          }, (index + 1) * 200);

        })
      }
    } else if (hinhthucthi === 0) {
      if (this.dataMonslect) {
        this.dataMonslect.forEach((f, index1) => {
          this.notifi.isProcessing(true);
          setTimeout(() => {
            const newDmMon = f;
            formUp.reset({
              order_id: order_id,
              thisinh_id: thisinh_id,
              kehoach_id: kehoach_id,
              tohop_monhoc: null,
              tenmon: newDmMon ? newDmMon.id : f.id,
              lephithi: this.lephithiData.value
            });
            this.orderMonhocService.create(formUp.value).subscribe({
              next: () => {
                this.notifi.isProcessing(false);
              },
              error: () => {
                this.notifi.isProcessing(false);
              }
            })
          }, (index1 + 1) * 200);
        });
      }
    }


  }

  getPayment(id: number) {
    const fullUrl: string = `${location.origin}${this.router.serializeUrl(this.router.createUrlTree(['admin/thi-sinh/dang-ky/']))}`;
    this.ordersService.getPayment(id, fullUrl).subscribe({
      next: (data) => {
        window.location.assign(data);
        this.ngType = 0;
        this.notifi.isProcessing(false);
      }, error: (e) => {
        this.notifi.isProcessing(false);
      }
    })
  }

  checkCodeParram(text: string) {
    this.notifi.isProcessing(true);
    this.ordersService.checkPaymentByUser(text).subscribe({
      next: (data) => {
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

  btnchecksite(num: number) {
    this.ngType = 0;
    this.router.navigate(['admin/thi-sinh/dang-ky/']);
    this.loadInit();
  }

  uniqueTohop(data: { tohopmon: number | null, tenmon: string }[]): { tohopmon: number | null, tenmon: string }[] {
    const uniqueNames: Record<number | null, boolean> = {};
    const result: { tohopmon: number | null, tenmon: string }[] = [];

    data.forEach(item => {
      if (item.tohopmon !== null) {
        if (!uniqueNames[item.tohopmon]) {
          uniqueNames[item.tohopmon] = true;
          result.push(item);
        }
      } else {
        result.push(item);
      }
    });

    return result;
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
  selectDothi(item:KeHoachThi){
    this.dotthi_id_select = item.id;
    this.f['kehoach_id'].setValue(this.dotthi_id_select);
    this.notifi.isProcessing(true);
    this.orderMonhocService.getDataMonSelect().subscribe({
      next:(data)=>{
        this.totalDangkyMonThi = data;
        console.log(this.totalDangkyMonThi);
        this.dataMonSelect = this.dmMon.map(m=>{
          const check = this.totalDangkyMonThi.find(t=>t.tenmon === m.id) ? this.totalDangkyMonThi.find(t=>t.tenmon === m.id).total :0;
          const total_remaining = (item.soluong_toida - check) < 0 ? 0 : (item.soluong_toida - check) ;
          // m['_total_dangky'] = 0;
          m['_total_dangky'] = total_remaining;
          m['__tenmon_coverted'] = m.tenmon + ' ['  + total_remaining + ']';
          return m;
        }).filter(f=>f['_total_dangky'] >0);
        this.notifi.isProcessing(false);
      },
      error:()=>{
        this.notifi.isProcessing(false);
      }
    })
    console.log(this.dmMon)

  }
  selectMonOfDmMon(item:DmMon){
    const monselect = !this.mon_ids_select.find(f=>f === item.id) ? [].concat(this.mon_ids_select, item.id) : this.mon_ids_select.filter(f=>f !== item.id);
    this.mon_ids_select = monselect;
    console.log(this.mon_ids_select);
    this.f['mon_ids'].setValue(this.mon_ids_select);
    this.selectTypeMon(0, this.mon_ids_select);
  }

  sendEmail(user,order){
    console.log(user);
    console.log(order);

    let message = `
        <p>Xin chào ${user.hoten} !</p>
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
                <td style="font-weight:600">${user.gioitinh === 'nam' ? "Nam": 'Nữ'}</td>
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
                <td style="font-weight:600">${this.noicapdata.find(f => f.code === user.cccd_noicap)?.title || 'Không xác định'}</td>
            </tr>
        </table>

        <p>CÁC MÔN ĐÃ ĐĂNG KÝ</p>
        <table style="border: 1px solid black;border-collapse: collapse;">
          <tr>
            <th width="100px">Môn thi</th>
            <th width="100px">Đơn giá (VNĐ)</th>
          </tr>
    `;
    const ordermon_ids = order.mon_id;
    ordermon_ids.forEach(i => {
      const mon = this.dmMon.find(f => f.id === i);
      if (mon) {
        message += `
      <tr>
        <td>${mon.tenmon}</td>
        <td>${this.lephithiData.value}</td>
      </tr>
    `;
      }
    });

    message += `
  <tr>
    <th>Tổng (VNĐ)</th>
    <td>${order.lephithi}</td>
  </tr>
    </table>
    <p>Vui lòng hoàn thành bước tiếp theo để hoàn thành đăng ký thi !!!</p>
`;

    console.log(message);

    const emailsend :OvicEmailObject = {
      name: "Email thông báo đăng ký thành công "    ,
      to:  this.auth.user.email ,
      title:' Email thông báo đăng ký thành công' ,
      message: message
    }
    this.notifi.isProcessing(true)
    this.senderEmailService.sendEmail(emailsend).subscribe({
      next:()=>{
        this.notifi.isProcessing(false)
        this.notifi.toastSuccess("Hệ thống gửi Email đăng ký thi thành công.");
      },error:()=>{
        this.notifi.isProcessing(false)
      this.notifi.toastError('Hệ thống gửi Email đăng ký không thành công');
      }
    })
  }

}

