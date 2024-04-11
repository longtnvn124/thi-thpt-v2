
import { Component, Input, OnInit } from '@angular/core';
import { NotificationService } from '@core/services/notification.service';
import { DmMon, DmToHopMon } from '@modules/shared/models/danh-muc';
import { ThptHoiDong, ThptHoiDongService } from '@modules/shared/services/thpt-hoi-dong.service';
import { OrdersMonhocTHPT, ThptOrderMonhocService } from '@modules/shared/services/thpt-order-monhoc.service';
import { DanhMucMonService } from "@shared/services/danh-muc-mon.service";
import { DanhMucToHopMonService } from "@shared/services/danh-muc-to-hop-mon.service";
import { KeHoachThi, ThptKehoachThiService } from "@shared/services/thpt-kehoach-thi.service";
import { OrdersTHPT, ThptOrdersService } from "@shared/services/thpt-orders.service";
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-phong-thi',
  templateUrl: './phong-thi.component.html',
  styleUrls: ['./phong-thi.component.css']
})
export class PhongThiComponent implements OnInit {
  @Input() hoidong_id: number;

  hoiDongData: ThptHoiDong;
  TypeChangePage: 0 | 1 | 2 = 0; // 0: not data room//1:have data room

  dmMon: DmMon[];
  dmToHopMon: DmToHopMon[];
  keHoachThi: KeHoachThi;
  OrderMonHoc: OrdersMonhocTHPT[];


  constructor(
    private hoiDongService: ThptHoiDongService,
    private notifi: NotificationService,
    private monService: DanhMucMonService,
    private tohopmonService: DanhMucToHopMonService,
    private kehoachThiService: ThptKehoachThiService,
    private OrderService: ThptOrdersService,
    private orderMonHocService: ThptOrderMonhocService
  ) {

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
    forkJoin<[DmMon[], DmToHopMon[], KeHoachThi, OrdersMonhocTHPT[]]>([
      this.monService.getDataUnlimit(),
      this.tohopmonService.getDataUnlimit(),
      this.kehoachThiService.getDataById(kehoach_id),
      this.orderMonHocService.getDataByKehoachId(kehoach_id),
    ]).subscribe({
      next: ([mon, tohopmon, kehoachthi, ordermonhoc]) => {
        this.dmMon = mon;
        this.dmToHopMon = tohopmon;
        this.keHoachThi = kehoachthi;
        this.OrderMonHoc = ordermonhoc;

      }, error: (e) => {
        this.notifi.toastError('Mất kết nối với máy chủ');
        this.notifi.isProcessing(false);
      }
    })
  }



}
