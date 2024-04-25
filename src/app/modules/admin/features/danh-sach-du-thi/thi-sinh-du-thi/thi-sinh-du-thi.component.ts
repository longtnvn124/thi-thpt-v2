import { ThemeSettingsService } from './../../../../../core/services/theme-settings.service';
import { KeHoachThi, ThptKehoachThiService } from '@shared/services/thpt-kehoach-thi.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { OrdersTHPT, ThptOrdersService } from "@shared/services/thpt-orders.service";
import { NotificationService } from "@core/services/notification.service";
import { DanhMucMonService } from "@shared/services/danh-muc-mon.service";
import { DanhMucToHopMonService } from "@shared/services/danh-muc-to-hop-mon.service";
import { Subscription, forkJoin } from "rxjs";
import { DmMon, DmToHopMon } from "@shared/models/danh-muc";
import { NgPaginateEvent } from '@modules/shared/models/ovic-models';
import { Paginator } from 'primeng/paginator';
import { ThisinhInfoService } from '@modules/shared/services/thisinh-info.service';
import { LoopPingPong } from 'three';
import { ThiSinhInfo } from '@modules/shared/models/thi-sinh';
import { FileService } from '@core/services/file.service';

@Component({
  selector: 'app-thi-sinh-du-thi',
  templateUrl: './thi-sinh-du-thi.component.html',
  styleUrls: ['./thi-sinh-du-thi.component.css']
})
export class ThiSinhDuThiComponent implements OnInit {
  @ViewChild('fromUser', { static: true }) template: TemplateRef<any>;
  @ViewChild(Paginator) paginator: Paginator;

  isLoading: boolean = true;
  loadInitFail: boolean = false;
  dmMon: DmMon[];
  dmToHopMon: DmToHopMon[];
  keHoachThi: KeHoachThi[];
  recordsTotal: number;
  listData: OrdersTHPT[];
  page: number = 1;

  _kehoach_id: number = null;
  _searchText: string = '';
  rows = this.themeSettingsService.settings.rows;
  menuName = 'thisinhduthi';
  sizeFullWidth: number;
  subscription = new Subscription();


  listStyle = [
    {
      value: 1, title: '<div class="thanh-toan true"><label> Đã thanh toán</label></div>',
    },
    {
      value: 0, title: '<div class="thanh-toan false"><label> Chưa thanh toán</label></div>',
    }
  ]
  constructor(
    private themeSettingsService: ThemeSettingsService,
    private orderServcier: ThptOrdersService,
    private notifi: NotificationService,
    private monService: DanhMucMonService,
    private toHopMonService: DanhMucToHopMonService,
    private thptKehoachThiService: ThptKehoachThiService,
    private thisinhInfoService: ThisinhInfoService,
    private fileSerive: FileService

  ) {
    const observerOnResize = this.notifi.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
  }

  ngOnInit(): void {

    forkJoin<[DmMon[], DmToHopMon[], KeHoachThi[]]>(
      this.monService.getDataUnlimit(),
      this.toHopMonService.getDataUnlimit(),
      this.thptKehoachThiService.getDataUnlimit()
    ).subscribe({
      next: ([dmMon, dmToHopMon, kehoachthi]) => {
        this.dmMon = dmMon;
        this.dmToHopMon = dmToHopMon.map(m => {
          let mon_ids_covered: string[] = [];
          m.mon_ids.forEach(f => {
            const name = this.dmMon && this.dmMon.find(a => a.id === f) ? this.dmMon.find(a => a.id === f).tenmon : '';
            mon_ids_covered.push(name);
          })
          m['__mon_ids_covered'] = mon_ids_covered ? mon_ids_covered : null;
          m['__tentohop_covered'] = mon_ids_covered ? m.tentohop + '(' + mon_ids_covered.join(', ') + ' )' : null;
          return m;
        });

        this.keHoachThi = kehoachthi;
        if (this.dmMon && this.dmToHopMon) {
          this.loadInit();
        }
        this.notifi.isProcessing(false);
      }, error: (e) => {
        this.notifi.isProcessing(false);
      }
    })
  }


  loadInit() {
    this.getData(1, null, null);
  }

  getData(page: number, kehoach_id: number, search: string) {

    this.page = page ? page : this.page;
    this._searchText = search ? search : this._searchText;
    this._kehoach_id = kehoach_id ? kehoach_id : this._kehoach_id;
    this.notifi.isProcessing(true);
    this.isLoading = true;
    this.orderServcier.getDataByWithThisinhAndSearchAndPage(this.page, kehoach_id, this._searchText).subscribe({
      next: ({ recordsTotal, data }) => {
        let index = 1;
        this.recordsTotal = recordsTotal;
        this.listData = data && data.length ? data.map(m => {
          const thi_sinh = m['thisinh'];
          const monhoc = m['monhoc'].map(m => {
            return { tohopmon: this.dmToHopMon.find(f => f.id === m['tohop_monhoc']) ? this.dmToHopMon.find(f => f.id === m['tohop_monhoc'])['__tentohop_covered'] : null, tenmon: m['tenmon'] };
          });
          console.log(monhoc  );

          const uniqueTohop = this.uniqueTohop(monhoc);
          m['_indexTable'] = page > 10 ? (page * 10 + index++) : index++;
          m['_thisinh_hoten'] = thi_sinh ? thi_sinh['hoten'] : '';
          m['_thisinh_email'] = thi_sinh ? thi_sinh['email'] : '';
          m['_thisinh_noisinh'] = thi_sinh ? thi_sinh['noisinh'] : '';
          m['_thisinh_gioitinh'] = thi_sinh && thi_sinh['gioitinh'] === 'nam' ? 'Nam' : 'Nữ';
          m['_thisinh_phone'] = thi_sinh ? thi_sinh['phone'] : '';
          if (uniqueTohop) {
            // m['__monthi_covered'] = uniqueTohop && uniqueTohop[0]['tohopmon'] !== null ? uniqueTohop[0]['tohopmon'] : uniqueTohop.map(c => c['tenmon']).join(', ');
            m['__monthi_covered'] = uniqueTohop && uniqueTohop[0]['tohopmon'] !== null ? uniqueTohop[0]['tohopmon'] : uniqueTohop.map(c => this.dmMon.find(v => v.id === parseInt(c['tenmon'])).tenmon).join(', ');

          }
          m['_kehoach_coverted'] = this.keHoachThi ? this.keHoachThi.find(f => f.id === m.kehoach_id).dotthi : '';
          m['__status_converted'] = m['trangthai_thanhtoan'] === 1 ? this.listStyle.find(f => f.value === 1).title : this.listStyle.find(f => f.value === 0).title;
          return m;
        }) : [];

        this.notifi.isProcessing(false);
        this.isLoading = false;


      }, error: () => {
        this.isLoading = false;
        this.notifi.isProcessing(false);
        this.notifi.toastError('Mất kết nối với máy chủ');
      }
    })
  };

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

  selectkeHoachThi(event) {

    this._kehoach_id = event;
    this.getData(1, event, this._searchText);
  }
  changeInput(event) {

    this.paginator.changePage(1);
    this._searchText = event;
    this.getData(this.page, this._kehoach_id, this._searchText);
  }

  paginate({ page }: NgPaginateEvent) {
    this.page = page + 1;
    this.getData(this.page, this._kehoach_id, this._searchText);
  }
  closeForm() {
    this.loadInit();
    this.notifi.closeSideNavigationMenu(this.menuName);
  }

  private preSetupForm(name: string) {
    this.notifi.isProcessing(false);
    this.notifi.openSideNavigationMenu({
      name,
      template: this.template,
      size: this.sizeFullWidth,
      offsetTop: '0px'
    });
  }


  userInfo: ThiSinhInfo;
  thisinh_id: number;
  btnShowUser(id: number) {
    this.preSetupForm(this.menuName);
    this.notifi.isProcessing(true);
    this.thisinh_id = id;

  }
}
