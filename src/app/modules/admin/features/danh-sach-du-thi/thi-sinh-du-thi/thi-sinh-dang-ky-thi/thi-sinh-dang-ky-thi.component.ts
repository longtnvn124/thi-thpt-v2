import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {OrdersTHPT, ThptOrdersService} from "@shared/services/thpt-orders.service";
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {KeHoachThi, ThptKehoachThiService} from "@shared/services/thpt-kehoach-thi.service";
import {forkJoin} from "rxjs";
import {DmMon} from "@shared/models/danh-muc";
import {NotificationService} from "@core/services/notification.service";

@Component({
  selector: 'app-thi-sinh-dang-ky-thi',
  templateUrl: './thi-sinh-dang-ky-thi.component.html',
  styleUrls: ['./thi-sinh-dang-ky-thi.component.css']
})
export class ThiSinhDangKyThiComponent implements OnInit,OnChanges {
  @Input() thiSinh_id: number;
  ngchangeType: 0 | 1 = 0;//o :load

  isLoading:boolean=false;
  loadInitFail:boolean=false;
  listdata:OrdersTHPT[];
  listStyle = [
    {value: 1, title: '<div class="thanh-toan true"><div></div><label> Đã thanh toán</label></div>',},
    {value: 0, title: '<div class="thanh-toan false"><div></div><label> Chưa thanh toán</label></div>',},
    {value: 2, title: '<div class="thanh-toan check"><div></div><label> Đã thanh toán, chờ duyệt</label></div>',}
  ]
  constructor(
    private orderService:ThptOrdersService,
    private danhMucMonService:DanhMucMonService,
    private kehoachthiService:ThptKehoachThiService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    if(this.thiSinh_id){
      this.loadData(this.thiSinh_id);
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    if (this.thiSinh_id) {
      this.loadData(this.thiSinh_id);
    }
  }

  loadInit(){
    this.loadData(this.thiSinh_id);

  }


  loadData(thisinh_id:number){
    this.notificationService.isProcessing(true);
    forkJoin<[DmMon[], KeHoachThi[], OrdersTHPT[]]>(
      this.danhMucMonService.getDataUnlimit(),
      this.kehoachthiService.getDataUnlimit(),
      this.orderService.getDataByIdthisinh(thisinh_id)
    ).subscribe({
      next:([dmMon, kehoachthi, orrder])=>{
        this.listdata = orrder.map((m,index)=>{
          m['_indexTable'] = index+1;
          m['_kehoachthi_covented'] =kehoachthi.find(f=>f.id === m.kehoach_id) ? kehoachthi.find(f=>f.id === m.kehoach_id).dotthi :'';
          m['_mon_ids_covertd'] = m.mon_id.map(f=>dmMon && dmMon.find(a=>a.id === f)? dmMon.find(a=>a.id === f).tenmon :'');
          m['__lephithi_covered'] = m.lephithi;
          m['__status_converted'] =  m['trangthai_thanhtoan'] === 1 ? this.listStyle.find(f => f.value === 1).title :(m.trangthai_chuyenkhoan ===0 ? this.listStyle.find(f => f.value === 0).title : this.listStyle.find(f => f.value === 2).title) ;
          return m;
        })
        this.notificationService.isProcessing(false);

      },
      error:()=>{
        this.notificationService.isProcessing(false);

        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }
}
