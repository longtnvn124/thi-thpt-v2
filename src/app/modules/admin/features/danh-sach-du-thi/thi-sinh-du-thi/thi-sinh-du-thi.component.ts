import {KeHoachThi, ThptKehoachThiService} from '@shared/services/thpt-kehoach-thi.service';
import {Component, ElementRef, HostListener, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {OrdersTHPT, ThptOrdersService} from "@shared/services/thpt-orders.service";
import {NotificationService} from "@core/services/notification.service";
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {Subscription, forkJoin, filter, Subject, debounceTime} from "rxjs";
import {DmMon,} from "@shared/models/danh-muc";
import {Paginator} from 'primeng/paginator';
import {NgPaginateEvent, OvicTableStructure} from "@shared/models/ovic-models";
import {BUTTON_NO, BUTTON_YES, OvicButton} from "@core/models/buttons";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {WAITING_POPUP} from "@shared/utils/syscat";
import {ExportThiSinhDuThiService} from "@shared/services/export-thi-sinh-du-thi.service";

@Component({
  selector: 'app-thi-sinh-du-thi',
  templateUrl: './thi-sinh-du-thi.component.html',
  styleUrls: ['./thi-sinh-du-thi.component.css']
})
export class ThiSinhDuThiComponent implements OnInit {
  @ViewChild('fromUser', {static: true}) fromUser: TemplateRef<any>;
  @ViewChild('formregister', {static: true}) formregister: TemplateRef<any>;
  @ViewChild('templateWaiting') templateWaiting: ElementRef;
  @ViewChild(Paginator) paginator: Paginator;
  @HostListener('window:resize', ['$event']) onResize(event: Event): void {
    this.isSmallScreen = window.innerWidth >1550;
  }
  isSmallScreen:boolean = window.innerWidth >1600;

  isLoading: boolean = true;
  loadInitFail: boolean = false;

  dsMon: DmMon[];
  dsKehoachthi: KeHoachThi[];

  recordsTotal: number;
  listData: OrdersTHPT[];
  dataSelct: OrdersTHPT[] = [];
  page: number = 1;

  kehoach_id: number = 0;

  tblStructure: OvicTableStructure[] = [
    {
      fieldType: 'normal',
      field: ['hoten'],
      innerData: true,
      header: 'Họ và tên',
      sortable: false
    },
    {
      fieldType: 'normal',
      field: ['cccd_so'],
      innerData: true,
      header: 'Số CCCD',
      sortable: false,
      headClass: 'ovic-w-130px text-center',
      rowClass: 'ovic-w-130px text-center'
    },
    {
      fieldType: 'normal',
      field: ['phone'],
      innerData: true,
      header: 'Số điện thoại',
      sortable: false,
      headClass: 'ovic-w-130px text-center',
      rowClass: 'ovic-w-130px text-center'
    },
    {
      fieldType: 'normal',
      field: ['ngaysinh'],
      innerData: true,
      header: 'Ngày sinh',
      sortable: false,
      headClass: 'ovic-w-150px text-center',
      rowClass: 'ovic-w-150px text-right'
    },
    {
      fieldType: 'normal',
      field: ['_gioitinh_converted'],
      innerData: true,
      header: 'Giới tính',
      sortable: false,
      headClass: 'ovic-w-130px text-center',
      rowClass: 'ovic-w-130px text-center'
    },
    {
      fieldType: 'normal',
      field: ['_dc_tc_coververted'],
      innerData: true,
      header: 'Địa chỉ thường trú',
      sortable: false
    },
    {
      tooltip: '',
      fieldType: 'buttons',
      field: [],
      rowClass: 'ovic-w-150px text-center',
      checker: 'fieldName',
      header: 'Thao tác',
      sortable: false,
      headClass: 'ovic-w-120px text-center',
      buttons: [
        {
          tooltip: 'Thông tin chi tiết',
          label: '',
          icon: 'pi pi-file',
          name: 'INFO_DECISION',
          cssClass: 'btn-primary rounded'
        },
        {
          tooltip: 'Chi tiết đăng ký',
          label: '',
          icon: 'pi pi-database',
          name: 'INFO_REGITTER',
          cssClass: 'btn-warning rounded'
        }
      ]
    }
  ];

  rows = this.themeSettingsService.settings.rows;
  menuName = 'thisinhduthi';
  sizeFullWidth: number;
  subscription = new Subscription();
  index = 1;
  search = '';
  needUpdate = false;
  private inputChanged: Subject<string> = new Subject<string>();

  listStyle = [
    {value: 1, title: '<div class="thanh-toan true text-center"><div></div><label>Đăng ký thành công</label></div>',},
    {value: 0, title: '<div class="thanh-toan false text-center"><div></div><label>Chưa thanh toán</label></div>',},
    {
      value: -1,
      title: '<div class="thanh-toan check text-center"><div></div><label>Đã thanh toán, chờ duyệt</label></div>',
    },
    {value: 2, title: '<div class="thanh-toan check text-center"><div></div><label>Giao dịch đang xử lý</label></div>',}
  ]

  constructor(
    private themeSettingsService: ThemeSettingsService,
    private ordersService: ThptOrdersService,
    private notifi: NotificationService,
    private monService: DanhMucMonService,
    private thptKehoachThiService: ThptKehoachThiService,
    private modalService: NgbModal,
    private exportThiSinhDuThiService: ExportThiSinhDuThiService
  ) {

    const observeProcessCloseForm = this.notifi.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData(this.page));
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notifi.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
  }

  ngOnInit(): void {
    this.inputChanged.pipe(debounceTime(1000)).subscribe((item: string) => {
      this.searchContentByInput(item);
    });
    this.loadInit();
  }
  loadInit() {
    forkJoin<[DmMon[], KeHoachThi[]]>(
      this.monService.getDataUnlimit(),
      this.thptKehoachThiService.getDataUnlimit()
    ).subscribe({
      next: ([mon, kehoachthi]) => {
        this.dsMon = mon;
        this.dsKehoachthi = kehoachthi;
        if (this.dsMon && this.dsKehoachthi) {
          this.loadData(1);
        }
      }
    })
  }

  loadData(page: number, kehoach_id?: number, search?: string) {
    this.isLoading = true;
    const limit = this.themeSettingsService.settings.rows;
    this.index = (page * limit) - limit + 1;
    this.notifi.isProcessing(true);
    this.ordersService.getDataByWithThisinhAndSearchAndPage(page, kehoach_id, search).subscribe({
      next: ({recordsTotal, data}) => {
        this.recordsTotal = recordsTotal
        this.listData = data.map((m, index) => {
          const thisinh = m['thisinh'];
          m['_indexTable'] = this.rows *(page-1) + index + 1;
          m['__order_id_coverted'] = 'VSAT' + m.id;
          m['__thisinh_hoten'] = thisinh ? thisinh['hoten'] : '';
          m['__thisinh_phone'] = thisinh ? thisinh['phone'] : '';
          m['__thisinh_cccd'] = thisinh ? thisinh['cccd_so'] : '';
          m['__thisinh_ngaysinh'] = thisinh ? thisinh['ngaysinh'] : '';
          m['__thisinh_gioitinh'] = thisinh ? thisinh['gioitinh'] : '';
          m['__thisinh_phone'] = thisinh ? thisinh['phone'] : '';
          m['__thisinh_email'] = thisinh ? thisinh['email'] : '';
          m['giadich'] = m.trangthai_thanhtoan === 1 ? m['transaction_id'] : (m.trangthai_thanhtoan === 1 && m['transaction_id'] ? 'CK-TT' : '');
          m['__dotthi_coverted'] = this.dsKehoachthi.find(f => f.id === m.kehoach_id).dotthi;
          m['__monthi_covered'] = this.dsMon ? m.mon_id.map(b => this.dsMon.find(f => f.id == b) ? this.dsMon.find(f => f.id == b) : []) : [];
          m['__status_converted'] = m.trangthai_thanhtoan === 1 ? this.listStyle.find(f => f.value === 1).title : (m.trangthai_thanhtoan === 0 && m.trangthai_chuyenkhoan === 0 ? this.listStyle.find(f => f.value === 0).title : (m.trangthai_thanhtoan === 0 && m.trangthai_chuyenkhoan === 1 ? this.listStyle.find(f => f.value === -1).title : (m.trangthai_thanhtoan === 2 ? this.listStyle.find(f => f.value === 2).title : '')));
          return m;
        })

        this.notifi.isProcessing(false);
        this.isLoading = false;
      }, error: () => {
        this.notifi.isProcessing(false);
        this.isLoading = false;
        this.notifi.toastError('Load dữ liệu không thành công');
      }
    })

  }

  loadDropdow(event) {

    this.kehoach_id = event;
    this.page = 1;
    this.loadData(this.page, this.kehoach_id, this.search);
  }

  closeForm() {
    this.loadInit();
    this.notifi.closeSideNavigationMenu(this.menuName);
  }

  onSearch(text: string) {
    this.search = text;
    this.paginator.changePage(1);
    this.page = 1;
    this.loadData(1, this.kehoach_id, text);
  }

  paginate({page}: NgPaginateEvent) {
    this.page = page + 1;
    this.loadData(this.page);
  }

  thisinh_id: number;

  searchContentByInput(text: string) {
    this.page = 1;

    var viTri = text.indexOf("vsat");

    if (viTri === -1) {
      var phanTuSau = text;
      this.search = phanTuSau.trim();

    } else {
      var phanTuSau = text.slice(viTri + 4);
      this.search = phanTuSau.trim();

    }

    this.loadData(1, this.kehoach_id, this.search);
  }

  onInputChange(event: string) {

    this.inputChanged.next(event);
  }

  btnViewTT(item: OrdersTHPT) {
    this.thisinh_id = item.thisinh_id;
    this.notifi.openSideNavigationMenu({
      name: this.menuName,
      template: this.fromUser,
      size: this.sizeFullWidth,
      offsetTop: '0px'
    });
  }

  async btnCheckTT() {
    if (this.dataSelct.length > 0) {
      const select_ids = this.dataSelct.map(m => m.id);
      const select_leght = this.dataSelct.length;
      const button = await this.notifi.confirmRounded('Xác nhận thanh toán thành công với ' + select_leght + ' thí sinh.','XÁC NHẬN',  [BUTTON_YES, BUTTON_NO]);
      if (button.name === BUTTON_YES.name) {
        this.notifi.isProcessing(true);
        this.modalService.open(this.templateWaiting, WAITING_POPUP);
        this.ordersService.activeOrder(select_ids).subscribe({
          next: () => {
            this.modalService.dismissAll();
            this.loadData(this.page, this.kehoach_id, this.search);
            this.notifi.toastSuccess('Thao tác thành công');
            this.notifi.isProcessing(false);
            this.dataSelct=[];

          }, error: () => {
            this.notifi.isProcessing(false);
            this.notifi.toastError('Thao tác không thành công');
            this.dataSelct=[];

          }
        })

      }
      // this.modalService.open(this.templateWaiting, WAITING_POPUP);
      // this.modalService.dismissAll();
    } else {
      this.notifi.toastWarning('Vui lòng chọn thi sinh');
    }
  }
  async btnDelete_ids(){
    if (this.dataSelct.length > 0) {
      console.log(this.dataSelct);
      const select_ids = this.dataSelct.map(m => m.id);
      const select_leght = this.dataSelct.length;
      const button = await this.notifi.confirmRounded('Xác nhận xóa đăng ký thi  ' + select_leght + ' thí sinh ?','XÁC NHẬN', [BUTTON_YES, BUTTON_NO]);
      if (button.name === BUTTON_YES.name) {
        this.notifi.isProcessing(true);
        this.modalService.open(this.templateWaiting, WAITING_POPUP);

        select_ids.forEach((f,index)=>{
          setTimeout(()=>{
            this.ordersService.delete(f).subscribe({
              next:()=>{
                this.listData= this.listData.filter(a=>a.id !==f);
              },error:()=>{
                this.notifi.toastError('Thao tác không thành công');
              }
            })
          },(index+1)*200);
        });
        this.modalService.dismissAll();
        this.dataSelct=[];
      }
      // this.modalService.open(this.templateWaiting, WAITING_POPUP);
      // this.modalService.dismissAll();
    } else {
      this.notifi.toastWarning('Vui lòng chọn thi sinh');
    }
  }

  btnExportExcel() {

    if (this.kehoach_id !== 0) {
      this.notifi.isProcessing(true);
      this.modalService.open(this.templateWaiting, WAITING_POPUP);
      this.ordersService.getDataByKehoachId(this.kehoach_id).subscribe({
        next: (data) => {
          const dataExport = data.map((m, index) => {
            const thisinh = m['thisinh'];
            m['__index'] = index + 1;
            m['__maDK'] = "VSAT" + m.id;
            m['__trangthai_thanhtoan'] = m.trangthai_thanhtoan === 1 ? 'Đăng ký thành công' : (m.trangthai_thanhtoan === 0 && m.trangthai_chuyenkhoan === 0 ? 'Chưa thanh toán' : (m.trangthai_thanhtoan === 0 && m.trangthai_chuyenkhoan === 1 ? 'Đã thanh toán,đang xử lý' : (m.trangthai_thanhtoan === 2 ? 'Giao dịch đang sử lý' : '')));
            m['__hoten'] = thisinh ? thisinh['hoten'] : '';
            m['__ngaysinh'] = thisinh ? thisinh['ngaysinh'] : '';
            m['__gioitinh'] = thisinh && thisinh['gioitinh'] === 'nam' ? 'Nam' : "Nữ";
            m['__email'] = thisinh ? thisinh['email'] : "";
            m['__cccd'] = thisinh ? thisinh['cccd_so'] : "";
            m['__phone'] = thisinh ? thisinh['phone'] : '';
            this.dsMon.forEach(f => {
              m[f.kyhieu] = m.mon_id.find(n => n === f.id) ? this.dsMon.find(a => a.id === f.id).tenmon : '';
            })
            return {
              index: m['__index'],
              id: m.id,
              madk: m['__maDK'],
              status: m['__trangthai_thanhtoan'],
              hoten: m['__hoten'],
              ngaysinh: m['__ngaysinh'],
              gioitinh: m['__gioitinh'],
              cccd: m['__cccd'],
              email: m['__email'],
              phone: m['__phone'],
              toan: m['TH'],
              li: m['VL'],
              hoa: m['HH'],
              sinh: m['SH'],
              lich: m['LS'],
              dia: m['DL'],
              anh: m['TA']
            };
          });


          if (dataExport) {
            this.modalService.dismissAll();
            this.exportThiSinhDuThiService.exportToLong(dataExport, this.dsKehoachthi.find(f => f.id === this.kehoach_id).dotthi);
          }
          this.notifi.isProcessing(false);
          this.modalService.dismissAll();
        },
        error: () => {
          this.modalService.dismissAll();
          this.notifi.toastError('Thao tác không thành công');
          this.notifi.isProcessing(false)
        }
      })
    } else {
      this.notifi.toastError('Vui lòng chọn đợt thi');
    }
  }
  selectDataByCheckbox(event){
    if (event.checked === true){
      this.dataSelct = this.listData.filter(f=>f.trangthai_thanhtoan !== 1);
    }else {
      this.dataSelct = [];
    }
  }

}
