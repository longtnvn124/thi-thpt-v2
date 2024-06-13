import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ThptHoidongThisinhService} from "@shared/services/thpt-hoidong-thisinh.service";
import {ThptHoiDong, ThptHoiDongService} from "@shared/services/thpt-hoi-dong.service";
import {forkJoin} from "rxjs";
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {NotificationService} from "@core/services/notification.service";
import {DmMon} from "@shared/models/danh-muc";
import {ThptHoiDongThiSinh} from "@shared/models/thpt-model";


@Component({
  selector: 'thong-ke-du-lieu',
  templateUrl: './thong-ke-du-lieu.component.html',
  styleUrls: ['./thong-ke-du-lieu.component.css']
})
export class ThongKeDuLieuComponent implements OnInit, OnChanges {
  @Input() hoidong_id: number
  isLoading:boolean = true;
  dmMon:DmMon[];
  thisinhs:ThptHoiDongThiSinh[] = [];
  dsMonDky= {};
  phongthis:ThptHoiDongThiSinh[];
  constructor(
    private thptHoidongThisinhService: ThptHoidongThisinhService,
    private thptHoiDongService: ThptHoiDongService,
    private danhMucMonService: DanhMucMonService,
    private notificationSerivce: NotificationService
  ) {
  }

  ngOnChanges(): void {
    if (this.hoidong_id) {
      this.loadData();
    }
  }

  ngOnInit(): void {
    this.loadData();

  }

  loadData() {
    this.isLoading =true;
    this.notificationSerivce.isProcessing(true);
    forkJoin(
      this.danhMucMonService.getDataUnlimit(),
      this.thptHoidongThisinhService.getDataPhongthiOnlyByHoidongId(this.hoidong_id),
      this.thptHoidongThisinhService.getDataPhongthiandMonthi_idsByHoidong_id(this.hoidong_id),
    ).subscribe({
      next: ([dmMon, phongthi, thisinhs]) => {
        const dsMonDky = {};
        dmMon.forEach(mon=>{
          dsMonDky['mon_' + mon.kyhieu.toLowerCase()]= this.countOccurrences(mon.id,thisinhs)
        })
        this.thisinhs = thisinhs
        this.dsMonDky =dsMonDky;
        phongthi.map(m=>{
          const thisinhs_in_room = thisinhs.filter(f=>f['phongthi'] === m['phongthi']);
          const cathis = [];
          for (let i = 0; i < 7; i++) {
            const item = {
              id: i + 1,
              total_thisinh: thisinhs_in_room.length
            }
            item['_total_ca_th'] = thisinhs_in_room.filter(thisinh => thisinh['ca_th'] === i + 1) ? thisinhs_in_room.filter(thisinh => thisinh['ca_th'] === i + 1).length : 0;
            item['_total_ca_vl'] = thisinhs_in_room.filter(thisinh => thisinh['ca_vl'] === i + 1) ? thisinhs_in_room.filter(thisinh => thisinh['ca_vl'] === i + 1).length : 0;
            item['_total_ca_hh'] = thisinhs_in_room.filter(thisinh => thisinh['ca_hh'] === i + 1) ? thisinhs_in_room.filter(thisinh => thisinh['ca_hh'] === i + 1).length : 0;
            item['_total_ca_sh'] = thisinhs_in_room.filter(thisinh => thisinh['ca_sh'] === i + 1) ? thisinhs_in_room.filter(thisinh => thisinh['ca_sh'] === i + 1).length : 0;
            item['_total_ca_ls'] = thisinhs_in_room.filter(thisinh => thisinh['ca_ls'] === i + 1) ? thisinhs_in_room.filter(thisinh => thisinh['ca_ls'] === i + 1).length : 0;
            item['_total_ca_dl'] = thisinhs_in_room.filter(thisinh => thisinh['ca_dl'] === i + 1) ? thisinhs_in_room.filter(thisinh => thisinh['ca_dl'] === i + 1).length : 0;
            item['_total_ca_ta'] = thisinhs_in_room.filter(thisinh => thisinh['ca_ta'] === i + 1) ? thisinhs_in_room.filter(thisinh => thisinh['ca_ta'] === i + 1).length : 0;
            item['_total_mon_incathi'] =item['_total_ca_th']+ item['_total_ca_vl']+ item['_total_ca_hh']+ item['_total_ca_sh']+ item['_total_ca_ls']+ item['_total_ca_dl']+ item['_total_ca_ta'];
            cathis.push(item);
            m['_cathi_total_'+ (i+1)]= this.covernumber(item['_total_mon_incathi']);

          }
          m['cathis'] = cathis.filter(cathi =>cathi['_total_mon_incathi'] >0);

          return m;
        })


        this.phongthis = phongthi
        this.notificationSerivce.isProcessing(false);
        this.isLoading =false;

      },
      error: () => {
        this.isLoading =false;
        this.notificationSerivce.isProcessing(false);
        this.notificationSerivce.toastError('Load dữ liệu không thành công');
      }
    })
  }

  countOccurrences(number, data) {
    return data.reduce((acc, item) => acc + (item.monthi_ids.includes(number) ? 1 : 0), 0);
  }

  covernumber(input: number) {
    return input < 10 ? '0' + input : input.toString();
  }



}
