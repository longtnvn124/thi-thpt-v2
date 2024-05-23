import {Component, OnInit, ViewChild} from '@angular/core';
import {ChartComponent} from 'ng-apexcharts';
import {forkJoin, of, switchMap} from 'rxjs';
import {AuthService} from '@core/services/auth.service';
import {ThisinhInfoService} from "@shared/services/thisinh-info.service";
import {NotificationService} from "@core/services/notification.service";
import {OrdersTHPT, ThptOrdersService} from "@shared/services/thpt-orders.service";
import {KeHoachThi, ThptKehoachThiService} from "@shared/services/thpt-kehoach-thi.service";
import {ThptOrderMonhocService} from "@shared/services/thpt-order-monhoc.service";
import {DmMon} from "@shared/models/danh-muc";
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {ConfigsService} from "@shared/services/configs.service";


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']

})
export class HomeComponent implements OnInit {
  @ViewChild('c1', {static: true}) private c1Component: ChartComponent;

  chartKehoachthi:any;
  optionsCharts:any;
  chartMonthi : any ;
  dmMonthi: DmMon[];
  constructor(
    private auth: AuthService,
    private thisinhInfo : ThisinhInfoService,
    private notificationService:NotificationService,
    private thptOrderService:ThptOrdersService,
    private thptKehoachThiService:ThptKehoachThiService,
    private thptOrderMonHoc:ThptOrderMonhocService,
    private danhMucMonService : DanhMucMonService,
    private configsService: ConfigsService
  ) {
    this.optionsCharts = {
      indexAxis: 'x',
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        legend: {
          labels: {
            // color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: {
            font: {
              weight: 500
            }
          },
          grid: {
            drawBorder: false
          }
        },
        y: {
          ticks: {
          },
          grid: {
            drawBorder: false
          }
        }
      }
    };
  }

  ngOnInit(): void {
    this.configsService.getdatabyconfig_key('__NAM_BAT_DAU').subscribe({
      next:(data)=>{},
      error:()=>{}
    })
    this.loadInit()
  }

  totalThisinh :number =0;
  totalOrder: number =0;
  totalLephithi: number =0;
  totalOrderTT: number = 0;
  kehoachthi : KeHoachThi[];
  dsOrders:OrdersTHPT[];
  loadInit(){
    this.notificationService.isProcessing(true);

    forkJoin <[DmMon[] , number, number,number ,number,[KeHoachThi[], OrdersTHPT[]]]>(
      this.danhMucMonService.getDataUnlimit(),
      this.thisinhInfo.getCountThiSinh(),
      this.thptOrderService.getTotalOrder(),
      this.thptOrderService.getTotalLephithi(),
      this.thptOrderService.getCountTT(),

      this.thptKehoachThiService.getDataUnlimit().pipe(switchMap(prj=>{

          const ids = prj.map(m=>m.id);
          return forkJoin<[KeHoachThi[],OrdersTHPT[]]>( of(prj), this.thptOrderService.getCountTTbykehoachIds(ids))
      }))
      ).subscribe({
      next:([dmMon, totalThiSinh,totalOrder,totalLephithi,totalOrderTT, [kehoachthi, order]])=>{
        this.dmMonthi = dmMon;
        this.totalThisinh =totalThiSinh;
        this.totalOrder =totalOrder;
        this.totalLephithi =totalLephithi;
        this.totalOrderTT =totalOrderTT;
        this.dsOrders = order;

        this.kehoachthi = kehoachthi.map(m=>{
          m['__totalOrders'] =order.filter(f=>f.kehoach_id === m.id) ? order.filter(f=>f.kehoach_id === m.id).length : 0;
          m['__totalOrdersTT'] = order.filter(f=>f.kehoach_id === m.id && f.trangthai_thanhtoan === 1) ? order.filter(f=>f.kehoach_id === m.id && f.trangthai_thanhtoan === 1).length : 0 ;
          return m;
        })
        if(this.kehoachthi.length>0){
          this.chartKehoachthi = {
            labels: this.kehoachthi.map(m=> m.dotthi),
            datasets: [
              {
                label: 'Chưa thanh toán',
                backgroundColor: '#d55e5e',
                data: this.kehoachthi.map(m=> m['__totalOrders'])
              },{
                label: 'Đã thanh toán',
                backgroundColor: '#63c3b3',
                data: this.kehoachthi.map(m=> m['__totalOrdersTT'])
              },
            ]
          }
        }



        this.notificationService.isProcessing(false);
      },error:()=>{
        this.notificationService.isProcessing(false);
      }
    })
  }

  kehoachthiSelect :KeHoachThi;

  btnSectCharts(event){
    this.chartMonthi= {};
    const kehoachthiSelect = this.kehoachthi[event.element.index];
    this.kehoachthiSelect = kehoachthiSelect;
    const text = this.chartKehoachthi.datasets[event.element.datasetIndex].label;

    if(text === 'Chưa thanh toán'){
      const kehoachthiSelect = this.kehoachthi[event.element.index];
      const orderByKehoach = this.dsOrders.filter(f=>f.trangthai_thanhtoan !== 1 && f.kehoach_id === kehoachthiSelect.id);
      const dsMonthi =[];
      this.dmMonthi.forEach(m=>{
        const item  = {}
        item['tenmon'] = m.tenmon;
        let total_item = 0
        orderByKehoach.forEach(a=>{
          if(a.mon_id.find(n=>n === m.id)){
            total_item = total_item + 1;
          }
        })
        item['total_tt'] = total_item;
        dsMonthi.push(item);
      })
      if(dsMonthi.length>0){
        this.chartMonthi = {
          labels: dsMonthi.map(m=> m.tenmon),
          datasets: [
            {
              label: 'Chưa thanh toán',
              backgroundColor: '#d55e5e',
              data: dsMonthi.map(m=>m.total_tt)
            },
          ]
        }
      }
    }
    if(text === 'Đã thanh toán'){
      const kehoachthiSelect = this.kehoachthi[event.element.index];
      const orderByKehoach = this.dsOrders.filter(f=>f.trangthai_thanhtoan === 1 && f.kehoach_id === kehoachthiSelect.id);
      const dsMonthi =[];
      this.dmMonthi.forEach(m=>{
        const item  = {}
        item['tenmon'] = m.tenmon;
        let total_item = 0
        orderByKehoach.forEach(a=>{
          if(a.mon_id.find(n=>n === m.id)){
            total_item = total_item + 1;
          }
        })
        item['total_tt'] = total_item;
        dsMonthi.push(item);
      })
      if(dsMonthi.length>0){
        this.chartMonthi = {
          labels: dsMonthi.map(m=> m.tenmon),
          datasets: [
            {
              label: 'Đã thanh toán',
              backgroundColor: '#63c3b3',
              data: dsMonthi.map(m=>m.total_tt)
            },
          ]
        }
      }
      // const kehoachthiSelect = this.kehoachthi[event.element.index];
      // this.kehoachthiSelect = kehoachthiSelect;
      // console.log(kehoachthiSelect)
      // this.notificationService.isProcessing(true)
      // this.thptOrderMonHoc.getDataByKehoachId(kehoachthiSelect.id).subscribe({
      //   next:(data)=>{
      //     console.log(data)
      //     const dsMonthi =[];
      //
      //     this.dmMonthi.forEach(m=>{
      //       const item  = {}
      //       item['tenmon'] = m.tenmon;
      //       item['total_tt'] = data.filter(f=>f.tenmon === m.id).length > 0 ? data.filter(f=>f.tenmon === m.id).length : 0;
      //       dsMonthi.push(item);
      //     })
      //     console.log(dsMonthi);
      //
      //     if(dsMonthi.length>0){
      //       this.chartMonthi = {
      //         labels: dsMonthi.map(m=> m.tenmon),
      //         datasets: [
      //           {
      //             label: 'Đã thanh toán',
      //             backgroundColor: '#63c3b3',
      //             data: dsMonthi.map(m=>m.total_tt)
      //           },
      //         ]
      //       }
      //     }
      //
      //
      //     this.notificationService.isProcessing(false)
      //   },
      //   error:(e)=>{
      //     this.notificationService.toastError('Load dữ liệu môn thi không thành công');
      //     this.notificationService.isProcessing(false)
      //   }
      // })
    }


  }

}
