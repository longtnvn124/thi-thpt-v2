import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ThptHoiDong } from '@modules/shared/services/thpt-hoi-dong.service';
import { Paginator } from 'primeng/paginator';
import { EmployeesPickerService } from "@shared/services/employees-picker.service";
import { ThptOrdersService } from "@shared/services/thpt-orders.service";
import { ThemeSettingsService } from '@core/services/theme-settings.service';
import { ThptHoiDongThiSinh } from '@modules/shared/models/thpt-model';
import { ThptHoidongThisinhService } from '@modules/shared/services/thpt-hoidong-thisinh.service';
import { NgPaginateEvent } from '@modules/shared/models/ovic-models';
import { NotificationService } from '@core/services/notification.service';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Observable, catchError, concatMap, delay, finalize, forkJoin, of } from 'rxjs';
import { ThisinhInfoService } from '@modules/shared/services/thisinh-info.service';

@Component({
  selector: 'app-add-thi-sinh',
  templateUrl: './add-thi-sinh.component.html',
  styleUrls: ['./add-thi-sinh.component.css']
})
export class AddThiSinhComponent implements OnInit {
  @ViewChild(Paginator) paginator: Paginator;
  @Input() hoidong_id: number;
  @Input() kehoach_id: number;
  @ViewChild('templateWaiting') templateWaiting: ElementRef;


  hoiDongData: ThptHoiDong;
  TypeChangePage: 0 | 1 | 2 | 3 = 0; // 0: not data room//1:have data room //3:showDataroom
  rows: number = this.themeSettingsService.settings.rows;
  isloading: boolean = true;
  page: number = 1;
  recordsTotal: number;
  dataSelct: ThptHoiDongThiSinh[] = [];
  listData: ThptHoiDongThiSinh[];
  constructor(
    private pickker: EmployeesPickerService,
    private orderSerivce: ThptOrdersService,
    private themeSettingsService: ThemeSettingsService,
    private hoiDongThiSinhService: ThptHoidongThisinhService,
    private notifi: NotificationService,

    private thisinhInfoService: ThisinhInfoService

  ) { }


  ngOnInit(): void {
    if (this.hoidong_id) {
      this.loadInit();
    }
  }

  loadInit() {
    this.loadData(1);
  }

  loadData(page: number) {
    this.listData = [];
    this.isloading = true;
    this.hoiDongThiSinhService.getDataByHoiDongId(page, this.hoidong_id).subscribe({
      next: ({ recordsTotal, data }) => {
        this.recordsTotal = recordsTotal;
        this.listData = data.map((m,index) => {
          m['_stt'] = this.rows *(page-1) + index +1;
          const thisinh = m['thisinh'];
          m['_hoten'] = thisinh ? thisinh['hoten'] : '';
          m['_phone'] = thisinh ? thisinh['phone'] : '';
          m['_email'] = thisinh ? thisinh['email'] : '';
          m['_ngaysinh'] = thisinh ? thisinh['ngaysinh'] : '';
          m['_cccd_so'] = thisinh ? thisinh['cccd_so'] : '';
          m['_gioitinh'] = thisinh && thisinh['gioitinh'] === 'nam' ? 'Nam' : 'Nữ';
          return m;
        })

        this.isloading = false;
      }, error: () => {
        this.isloading = false;
        this.notifi.toastError('Mất kết nối với máy chủ');
      }
    });
  }

  paginate({ page }: NgPaginateEvent) {
    this.page = page + 1;
    this.loadData(this.page);
  }

  async btnAddNew() {
    const isSet: Set<number> = this.listData ? this.listData.reduce((conllector, { thisinh_id }) => {
      conllector.add(thisinh_id);
      return conllector;
    }, new Set<number>()) : new Set<number>();
    try {
      const result = await this.pickker.pickerUser([], this.kehoach_id);


      if (result && result.length) {
        const validObjects: Set<number> = result.reduce((collector, item) => {
          if (!isSet.has(item)) {
            collector.add(item);
          }
          return collector;
        }, new Set<number>());
        const thisinh_ids = Array.from(validObjects);
        if (thisinh_ids && thisinh_ids.length) {
          this.processItems(thisinh_ids);

        } else {
          this.notifi.toastWarning('Thí sinh đã được thêm vào hội đồng');
        }

      }
    } catch (e) {
    }
  }

  async processItems(thisinh_ids: number[]) {
    const requests$: Observable<any>[] = [];
    this.isloading = true;
    thisinh_ids.forEach((r, index) => {
      const newObject = {
        hoidong_id: this.hoidong_id,
        thisinh_id: r
      };

      const request$ =
        this.hoiDongThiSinhService.create(newObject).pipe(
          concatMap((id) => {
            return of(null);
          }),
          delay(index * 500),
          catchError(error => {
            console.error(error);
            return of(null);
          })
        );

      requests$.push(request$);
    });

    forkJoin(requests$).pipe(
      finalize(() => {
        this.loadData(this.page);
        this.isloading = false;
      })
    ).subscribe();
  }

  async btndelete() {

    if (this.dataSelct && this.dataSelct.length) {
      const confirm = await this.notifi.confirmDelete();
      if (confirm) {
        try {
          this.startDeletes();
        } catch (error) {
          this.notifi.isProcessing(false);
          this.notifi.toastError('Thao tác không thành công');
        }
      }
    }
  }


  private startDeletes() {
    if (this.dataSelct.length) {
      const row: ThptHoiDongThiSinh = this.dataSelct.pop();
      this.hoiDongThiSinhService.delete(row.id).subscribe({
        next: () => {
          this.listData = this.listData.filter(u => row.id !== u.id);
          this.startDeletes();
        },
        error: () => {
          this.listData = this.listData.filter(u => row.id !== u.id);
          this.startDeletes();
        },
      })
    } else {
      this.notifi.isProcessing(false);
      this.loadInit();
    }
  }

}
