import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {ThptHoiDong, ThptHoiDongService} from "@shared/services/thpt-hoi-dong.service";
import {ThptHoidongThisinhService} from "@shared/services/thpt-hoidong-thisinh.service";
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {SenderEmailService} from "@shared/services/sender-email.service";
import {ExpostExcelPhongthiThisinhService} from "@shared/services/expost-excel-phongthi-thisinh.service";
import {DanhMucPhongThiService, DmPhongThi} from "@shared/services/danh-muc-phong-thi.service";
import {forkJoin, from, Observable, of, switchMap} from "rxjs";
import {map} from "rxjs/operators";
import {ThptHoiDongThiSinh} from "@shared/models/thpt-model";
import {FileService} from "@core/services/file.service";
import {NotificationService} from "@core/services/notification.service";
import {HoiDongLichThiService, ThptLichThi} from "@shared/services/hoi-dong-lich-thi.service";
import {DmMon} from "@shared/models/danh-muc";
import {WAITING_POPUP} from "@shared/utils/syscat";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {HtmlToPdfService} from "@shared/services/html-to-pdf.service";
import {HelperService} from "@core/services/helper.service";
import {BUTTON_NO, BUTTON_YES} from "@core/models/buttons";

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
  selector: 'thi-sinh-in-hoi-dong',
  templateUrl: './thi-sinh-in-hoi-dong.component.html',
  styleUrls: ['./thi-sinh-in-hoi-dong.component.css']
})

export class ThiSinhInHoiDongComponent implements OnInit, OnChanges {
  @Input() hoidong_id: number;
  @Input() kehoach_id: number;
  @ViewChild('templateWaiting') templateWaiting: ElementRef;

  //=================== Danh muc===================================
  dmMon: DmMon[];
  dmPhongthi: DmPhongThi[];
  dmLichthi: ThptLichThi[];
  hoidong: ThptHoiDong;
  isLoading: boolean = false;
  cathi_id_select: number;
  // ==================================
  thisinhInhoidong: ThptHoiDongThiSinh[] = [];

  constructor(
    private dmMonSerive: DanhMucMonService,
    private danhMucPhongThiService: DanhMucPhongThiService,
    private hoidongService: ThptHoiDongService,
    private hoidongThisinhSerive: ThptHoidongThisinhService,
    private senderEmailService: SenderEmailService,
    private expostExcelPhongthiThisinhService: ExpostExcelPhongthiThisinhService,
    private fileService: FileService,
    private notificationService: NotificationService,
    private thptLichThiService: HoiDongLichThiService,
    private modalService: NgbModal,
    private htmlToPdfService: HtmlToPdfService,
    private helperService: HelperService
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.hoidong_id) {
      this.loadInit()
    }
  }

  ngOnInit(): void {
    if (this.hoidong_id) {
      this.loadInit()
    }
  }

  loadInit() {
    forkJoin<[DmMon[], DmPhongThi[], ThptLichThi[], ThptHoiDong]>(
      this.dmMonSerive.getDataUnlimit(),
      this.danhMucPhongThiService.getDataUnlimit(),
      this.thptLichThiService.getDataUnlimit(),
      this.hoidongService.getHoidongonly(this.hoidong_id)
    ).subscribe({
      next: ([dmMon, dmPhongthi, dmLichthi, thptHoidong]) => {
        this.dmMon = dmMon;
        this.dmPhongthi = this.convertDmPhongThi(dmPhongthi).map(m => {
          m['ten_phong'] = 'Phòng ' + m.phongso;
          return m
        });
        this.dmLichthi = dmLichthi.map(m => {
          m['ten_cathi'] = 'Ca ' + m.id;
          return m;
        });
        this.hoidong = thptHoidong
        if (this.dmMon && this.dmPhongthi && this.dmLichthi) {
          this.getDathThisinh(this.hoidong_id)
        }
      }, error: () => {
        this.notificationService.toastError('Load dữ liệu không thành công');
      }
    })
  }

  // .pipe(switchMap(pjs=>{return this.loadThiSinhAvatarProcess(pjs)}))
  getDathThisinh(hoidong_id: number, phongthi_id_select?: number) {
    this.isLoading = true;
    this.notificationService.isProcessing(true);
    this.hoidongThisinhSerive.getDataByHoidongIdUnlimit(hoidong_id, phongthi_id_select).subscribe({
      next: (data) => {
        this.thisinhInhoidong = data.sort((a, b) => b.monthi_ids.length - a.monthi_ids.length).map((m, index) => {
          const thisinh = m['thisinh'];
          m['__index'] = index + 1;
          m['__hoten'] = thisinh ? thisinh['hoten'] : '';
          m['__sobaodanh'] = this.hoidong.tiento_sobaodanh + this.covertId(m.thisinh_id);
          m['__ngaysinh'] = thisinh ? thisinh['ngaysinh'] : '';
          m['__gioitinh'] = thisinh && thisinh['gioitinh'] === 'nu' ? 'Nữ' : 'Nam';
          m['__cccd_so'] = thisinh ? thisinh['cccd_so'] : '';

          return m;
        })


        this.isLoading = false;
        this.notificationService.isProcessing(false);

      }, error: (e) => {
        this.isLoading = false;
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Load dữ liệu thí sinh không thành công ');
      }
    })
  }

  private loadThiSinhAvatarProcess(info: ThptHoiDongThiSinh[]): Observable<ThptHoiDongThiSinh[]> {
    try {

      const index: number = info.findIndex(t => !t['_avatarLoaded']);
      if (index !== -1) {
        return this.fileService.getFileAsBlobByName(info[index]['thisinh']['anh_chandung'][0].id.toString()).pipe(switchMap(blob => {
          info[index]['_avatarLoaded'] = true;
          return forkJoin<[string, ThptHoiDongThiSinh[]]>(
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

  //==============================danh muc=============
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

  covertId(iput: number) {
    return iput < 10 ? '000' + iput : (iput >= 10 && iput < 100 ? '00' + iput : (iput >= 100 && iput < 1000 ? '0' + iput : iput));
  }

  //=====================================================
  phongthi_id_select: number;

  cathiChange(event) {

    this.phongthi_id_select = event.value;
    this.getDathThisinh(this.hoidong_id, event.value);
  }

  btnExportAlbumAnh() {
    this.modalService.open(this.templateWaiting, WAITING_POPUP);
    const fileName = this.hoidong.ten_hoidong + ' - Danh sách thí sinh';

    this.notificationService.isProcessing(true);
    this.hoidongThisinhSerive.getDataByHoidongIdUnlimit(this.hoidong_id).pipe(switchMap(pjs => {
      return this.loadThiSinhAvatarProcess(pjs).pipe(map(m => {
        pjs['__thisinh_info'] = m;
        return pjs
      }))
    })).subscribe({
      next: (data) => {
        const dataThisinh = data.sort().map(m => {
          m['hoidong'] = this.hoidong
          return m;
        })
        const dataMap = this.dmPhongthi.map(m => {
          m['thisinhs'] = dataThisinh.sort((a, b) => a['thisinh']['ten'].localeCompare(b['thisinh']['ten'])).filter(f => f['phongthi'] === m['phongso'])
          return m
        }).filter(f => f['thisinhs'].length > 0);
        if (dataMap.length > 0) {
          this.htmlToPdfService.exportHtmlToWordV2(dataMap, fileName);
          this.modalService.dismissAll();
        } else {
          this.modalService.dismissAll();
          this.notificationService.toastError('Chưa có dữ liệu thí sinh !');
        }
        this.notificationService.isProcessing(false);
        this.modalService.dismissAll();

      }, error: () => {
        this.notificationService.toastError('Thao tác không thành công');
        this.notificationService.isProcessing(false);
        this.modalService.dismissAll();

      }
    })
  }

  //============================Send Email =======================
  repplaceNgaysinh(text: string) {
    const parts = text.split('/');
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];

    // Chuyển đổi sang định dạng mới
    const newDateString = `${year}-${month}-${day}`;
    return newDateString;
  }

  async btnSendEmail() {
    const button = await this.notificationService.confirmRounded('Gửi email thông báo lịch thi cho thí sinh ', 'XÁC NHẬN', [BUTTON_NO, BUTTON_YES]);
    if (button.name === BUTTON_YES.name) {
      this.notificationService.isProcessing(true)
      this.hoidongThisinhSerive.getDataByHoidongIdUnlimit(this.hoidong_id).subscribe({
        next: (data) => {
          const dataParam = [];
          data.sort((a, b) => a['thisinh']['ten'].localeCompare(b['thisinh']['ten'])).forEach(m => {
            const thisinh = m['thisinh'];
            const phongthi: FormatPhongthiBythisinh[] = []
            m.monthi_ids.map((mon, index) => {
              const dmTungMon = this.dmMon.find(f => f.id === mon);
              const cathi = m['ca_' + dmTungMon.kyhieu.toLowerCase()];
              const item: FormatPhongthiBythisinh = {
                index: index + 1,
                monthi: dmTungMon.tenmon,
                ngaythi: this.helperService.formatSQLToDateDMY(new Date(this.hoidong.ngaythi)),
                phong: m['phongthi'],
                time_start: this.dmLichthi.find(f => f.id === cathi) ? this.dmLichthi.find(f => f.id === cathi).gio_goivao_phongthi : ''
              }
              phongthi.push(item)
            })
            const item: FormatthisinhSendEmail = {
              sobaodanh: thisinh ? this.hoidong.tiento_sobaodanh + this.covertId(thisinh['id']) : '',
              hoten: thisinh ? thisinh['hoten'] : '',
              ngaysinh: thisinh ? thisinh['ngaysinh'] : '',
              gioitinh: thisinh && thisinh['gioitinh'] === 'nu' ? 'Nữ' : 'Nam',
              cccd_so: thisinh ? thisinh['cccd_so'] : '',
              email: thisinh ? thisinh['email'] : '',
              dantoc: thisinh ? thisinh['dantoc'] : '',
              noisinh: thisinh ? thisinh['noisinh'] : '',
              thuongtru: thisinh ? thisinh['thuongtru_diachi']['fullAddress'] : '',
              created: false,
              phongthi: phongthi
            };
            dataParam.push(item);
          })

          if (dataParam.length > 0) {
            const step: number = 100 / dataParam.length;
            this.notificationService.loadingAnimationV2({process: {percent: 0}});
            this.emailCall(dataParam, step, 0).subscribe({
              next: (mess) => {
                this.notificationService.toastSuccess('Gửi Email thông báo lịch thi thành công');
                this.notificationService.isProcessing(false);
              }, error: (error) => {
                this.notificationService.toastError('Gửi Email thông báo lịch thi không thành công');
                this.notificationService.isProcessing(false);
                this.notificationService.disableLoadingAnimationV2();
              }
            })
          }

        },
        error: (e) => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Load dữ liệu thí sinh không thành công');
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
        <p>Hội đồng thi Đại học Thái Nguyên (V-SAT-TNU) thông báo tới bạn địa điểm và thời gian dự thi cụ thể như sau: </p>
        <p><strong>Địa điểm thi: </strong></p>
        <p>- Trung tâm Khảo thí và Quản lý chất lượng – Đại học Thái Nguyên</p>
        <p>- Địa chỉ:  Phường Tân Thịnh – Thành phố Thái Nguyên. </p>
        <p>- Google maps: <a href="https://maps.app.goo.gl/y7r7jQTZuTtrNU9w9" target="_blank">https://maps.app.goo.gl/y7r7jQTZuTtrNU9w9</a></p>
        <p><strong>Thời gian có mặt tại địa điểm thi:</strong></p>
        <p><u><b><i>- Buổi sáng: </i></b></u></p>
        <p>+ Thí sinh thi môn Toán: Trước 06:15</p>
        <p>+ Thí sinh không thi môn Toán: 08:30</p>
        <p> <u><b><i>- Buổi chiều:</i></b></u> Trước 12 giờ 45 phút</p>
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
        <table style=" border: 1px solid black;border-collapse: collapse;">
          <tr style="border: 1px solid black;border-collapse: collapse;">
            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="50px"><strong>STT</strong></th>
            <th style="border: 1px solid black;border-collapse: collapse;text-align:center;" width="100px"><strong>Số báo danh </strong></th>

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
        <td style="border: 1px solid black;border-collapse: collapse; text-align:center;">${item.sobaodanh}</td>
        <td style="border: 1px solid black;border-collapse: collapse; text-align:left;">${phongthi['monthi']}</td>
        <td style="border: 1px solid black;border-collapse: collapse; text-align:center;">${phongthi['phong']}</td>
        <td style="border: 1px solid black;border-collapse: collapse; text-align:center;">${phongthi['ngaythi']}</td>
        <td style="border: 1px solid black;border-collapse: collapse; text-align:center;">${phongthi['time_start']}</td>
      </tr>
        `;
      })
      message += `</table> <p>Chúc Bạn thành công.</p>`
      const emailsend: any = {
        title: 'THÔNG BÁO LỊCH THI V-SAT-TNU',
        to: email,
        message: message
      }
      return this.senderEmailService.sendEmail(emailsend).pipe(switchMap(() => {
        thisinhForm[index].created = true;
        const newPercent: number = percent + step;
        this.notificationService.loadingAnimationV2({process: {percent: newPercent}});
        return this.emailCall(thisinhForm, step, newPercent);
      }))

    } else {
      this.notificationService.disableLoadingAnimationV2();
      return of('complete');
    }
  }

  btnExportDsPhongthi() {
    this.notificationService.isProcessing(true);
    this.hoidongThisinhSerive.getDataByHoidongIdUnlimitnotOrder(this.hoidong_id).subscribe({
      next: (data) => {
        const thisinhInhoidong = data.sort((a, b) => b.monthi_ids.length - a.monthi_ids.length).map((m, index) => {
          const thisinh = m['thisinh'];
          m['__index'] = index + 1;
          m['__hoten'] = thisinh ? thisinh['hoten'] : '';
          m['__sobaodanh'] = this.hoidong.tiento_sobaodanh + this.covertId(m.thisinh_id);
          m['__ngaysinh'] = thisinh ? thisinh['ngaysinh'] : '';
          m['__gioitinh'] = thisinh && thisinh['gioitinh'] === 'nu' ? 'Nữ' : 'Nam';
          m['__cccd_so'] = thisinh ? thisinh['cccd_so'] : '';
          m['hoidong'] = this.hoidong;
          m['phongthi'] = m['phongthi']? m['phongthi'] : null
          return m ;
        })

        const phongthiPaam = []
        this.dmPhongthi.forEach(phongthi=>{
            const item ={
              dsThisinh : thisinhInhoidong.sort((a, b) => a['thisinh']['ten'].localeCompare(b['thisinh']['ten'])).filter(f=>f['phongthi'] === phongthi['phongso']).map((m,i)=>{
                const index =i+1
                return {index:index, sobaodanh:m['__sobaodanh'],hoten:m['__hoten'],ngaysinh:m['__ngaysinh'],gioitinh: m['__gioitinh'],cccd_so:m['__cccd_so'],ca_th:m['ca_th'] !== 0 ? m['ca_th'] :'',ca_vl:m['ca_vl'] !== 0 ? m['ca_vl'] :'',ca_hh:m['ca_hh'] !==0?m['ca_hh'] :'',ca_sh:m['ca_sh'] !==0?m['ca_sh'] :'',ca_ls:m['ca_ls'] !==0?m['ca_ls'] :'',ca_dl:m['ca_dl'] !==0?m['ca_dl'] :'',ca_ta:m['ca_ta'] !==0?m['ca_ta'] :'' }
              }),
              phongso:phongthi['phongso'],
              ngaythi: this.helperService.formatSQLToDateDMY(new Date(this.hoidong.ngaythi))
            }
            phongthiPaam.push(item);
        })

        this.expostExcelPhongthiThisinhService.exportHoidongPhongthi(('Danh sách phòng thi - ' + this.hoidong.ten_hoidong ),this.thisinhs_column,phongthiPaam.filter(f=>f.dsThisinh.length>0))


        this.notificationService.isProcessing(false);

      }, error: (e) => {
        this.notificationService.isProcessing(false);

      }
    })
  }
  thisinhs_column= ['STT','Số báo danh','Họ và tên ','Ngày sinh','Giới tính','Số CCCD','Ca thi Toán','Ca thi Vật lí',	'Ca thi Hóa học',	'Ca thi Sinh học',	'Ca thi Lịch sử','Ca thi Địa lí','Ca thi Tiếng Anh'
  ];

}
