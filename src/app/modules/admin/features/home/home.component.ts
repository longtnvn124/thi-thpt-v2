import {ChangeDetectorRef, Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {ChartOptions} from '@shared/models/chart-options';
import {ChartComponent, ApexAxisChartSeries} from 'ng-apexcharts';
import {DhtdHtkt} from '@shared/models/dhtd-htkt';

import {forkJoin, Observable, of, timer} from 'rxjs';
import {map} from 'rxjs/operators';
import {AuthService} from '@core/services/auth.service';
import {CardWidgetService} from '@modules/admin/features/home/widgets/card-widget/card-widget.component';
import {NguLieuDanhSachService} from "@shared/services/ngu-lieu-danh-sach.service";
import {NguLieuSuKienService} from "@shared/services/ngu-lieu-su-kien.service";
import {DotThiDanhSachService} from "@shared/services/dot-thi-danh-sach.service";
import {NganHangDeService} from "@shared/services/ngan-hang-de.service";
import {HttpParams} from "@angular/common/http";
import {Dto} from "@core/models/dto";
import {PointsService} from "@shared/services/points.service";
import {ThisinhInfoService} from "@shared/services/thisinh-info.service";
import {NotificationService} from "@core/services/notification.service";
import {ThptOrdersService} from "@shared/services/thpt-orders.service";
import {ThptHoiDongService} from "@shared/services/thpt-hoi-dong.service";

interface DhtdHtktReportTable {
  loading: boolean;
  error: boolean;
  data: {
    object: DhtdHtkt,
    person: {
      total: number,
      percent: number,
    },
    group: {
      total: number,
      percent: number,
    }
    summary: number,
  }[];
  mode: 'total' | 'percent';
  selected: {
    year: string,
    title: string,
    sum: number
  };
}


interface HomeWidget {
  service: CardWidgetService
  title: string,
  icon: TemplateRef<any>,
  styleClass: string,
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']

})
export class HomeComponent implements OnInit {

  @ViewChild('c1', {static: true}) private c1Component: ChartComponent;

  horizontalOptions = {
    indexAxis: 'y',
    plugins: {
      legend: {
        labels: {
          color: '#495057'
        }
      }
    },
    scales: {
      x: {
        ticks: {color: '#495057'},
        grid: {color: '#ebedef'}
      },
      y: {
        ticks: {
          color: '#495057'
        },
        grid: {
          color: '#ebedef'
        }
      }
    }
  };

  constructor(
    private auth: AuthService,
    private thisinhInfo : ThisinhInfoService,
    private notificationService:NotificationService,
    private thptOrderService:ThptOrdersService,
    private hoidongService:ThptHoiDongService
  ) {

  }

  ngOnInit(): void {
    this.loadInit()
  }

  totalThisinh :number =0;
  totalOrder: number =0;
  totalLephithi: number =0;
  totalHoidong: number =0;
  totalOrderTT: number = 0;
  loadInit(){
    this.notificationService.isProcessing(true);

    forkJoin <[number, number,number,number ,number]>(
      this.thisinhInfo.getCountThiSinh(),
      this.thptOrderService.getTotalOrder(),
      this.thptOrderService.getTotalLephithi(),
      this.hoidongService.getTotalHoidong(),
      this.thptOrderService.getCountTT()
      ).subscribe({
      next:([totalThiSinh,totalOrder,totalLephithi,totalHoidong,totalOrderTT])=>{
        this.totalThisinh =totalThiSinh;
        this.totalOrder =totalOrder;
        this.totalLephithi =totalLephithi;
        this.totalHoidong =totalHoidong;
        this.totalHoidong =totalHoidong;
        this.totalOrderTT =totalOrderTT;
        console.log(totalThiSinh)
        console.log(totalOrder)
        console.log(totalLephithi)
        console.log(totalHoidong)

        this.notificationService.isProcessing(false);
      },error:()=>{
        this.notificationService.isProcessing(false);
      }
    })
  }
}
