import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {Paginator} from 'primeng/paginator';
import {OrdersTHPT, ThptOrdersService} from "@shared/services/thpt-orders.service";
import {ThemeSettingsService} from '@core/services/theme-settings.service';
import {ThptHoiDongThiSinh} from '@modules/shared/models/thpt-model';
import {ThptHoidongThisinhService} from '@modules/shared/services/thpt-hoidong-thisinh.service';
import {NotificationService} from '@core/services/notification.service';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {BehaviorSubject, concatMap, forkJoin, Observable, of, switchMap} from 'rxjs';
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {DmMon} from "@shared/models/danh-muc";
import {catchError, delay, finalize} from "rxjs/operators";
import {WAITING_POPUP} from "@shared/utils/syscat";

@Component({
  selector: 'app-add-thi-sinh',
  templateUrl: './add-thi-sinh.component.html',
  styleUrls: ['./add-thi-sinh.component.css']
})
export class AddThiSinhComponent implements OnInit, OnChanges {
  @Output() onDataChange = new EventEmitter<any>();
  private dataSelectSubject = new BehaviorSubject<any>({});


  @ViewChild(Paginator) paginator: Paginator;
  @Input() hoidong_id: number;
  @Input() kehoach_id: number;
  @ViewChild('templateWaiting') templateWaiting: ElementRef;
  isLoading: boolean = false;

  dsMon: DmMon[];
  rows: number = this.themeSettingsService.settings.rows;
  isloading: boolean = true;
  page: number = 1;
  recordsTotalOrderThpt: number;
  dataOrderThpt: OrdersTHPT[] = [];
  dataOrderSelect: OrdersTHPT[] = [];
  dataThiSinhSelect: ThptHoiDongThiSinh[] = [];

  listData: ThptHoiDongThiSinh[];


  constructor(
    private orderSerivce: ThptOrdersService,
    private themeSettingsService: ThemeSettingsService,
    private hoiDongThiSinhService: ThptHoidongThisinhService,
    private notifi: NotificationService,
    private danhMucMonService: DanhMucMonService,
    private modalService: NgbModal,
  ) {
    this.dataSelectSubject.subscribe(data => this.emitDataChanges());

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.hoidong_id) {
      this.loadInit();
    }

  }


  ngOnInit(): void {
    this.emitDataChanges()
    if (this.hoidong_id) {
      this.danhMucMonService.getDataUnlimit().subscribe({
        next: (data) => {
          this.dsMon = data;
          this.loadInit();

        }
      })
    }
  }

  loadInit() {

    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.hoiDongThiSinhService.getDataByHoidongIdUnlimit(this.hoidong_id).pipe(switchMap(project => {
      const ids = project.length > 0 ? project.map(m => m.thisinh_id) : [];

      return forkJoin<[ThptHoiDongThiSinh[], OrdersTHPT[]]>([of(project), this.orderSerivce.getDataBykehoachIdAndStatusUnlimit(this.kehoach_id, ids)]);
    })).subscribe({
      next: ([dataThiSinh, orderThpt]) => {
        this.isLoading = false;

        this.dataOrderThpt = this.ConverDataOrder(orderThpt).map((m, index) => {
          const thisinh = m['thisinh'];
          m['_indexTable'] = index + 1;
          m['__thisinh_hoten'] = thisinh ? thisinh['hoten'] : '';
          m['__thisinh_phone'] = thisinh ? thisinh['phone'] : '';
          m['__thisinh_cccd'] = thisinh ? thisinh['cccd_so'] : '';
          m['__thisinh_ngaysinh'] = thisinh ? thisinh['ngaysinh'] : '';
          m['__thisinh_gioitinh'] = thisinh ? thisinh['gioitinh'] : '';
          m['__thisinh_phone'] = thisinh ? thisinh['phone'] : '';
          m['__thisinh_email'] = thisinh ? thisinh['email'] : '';
          m['__monthi_covered'] = this.dsMon ? m.mon_id.map(b => this.dsMon.find(f => f.id == b) ? this.dsMon.find(f => f.id == b) : []) : [];
          return m;
        });
        this.recordsTotalOrderThpt = this.dataOrderThpt.length;
        this.listData = dataThiSinh.map((m, index) => {
          const thisinh = m['thisinh'];
          m['_indexTable'] = index + 1;

          m['__thisinh_hoten'] = thisinh ? thisinh['hoten'] : '';
          m['__thisinh_phone'] = thisinh ? thisinh['phone'] : '';
          m['__thisinh_cccd'] = thisinh ? thisinh['cccd_so'] : '';
          m['__thisinh_ngaysinh'] = thisinh ? thisinh['ngaysinh'] : '';
          m['__thisinh_gioitinh'] = thisinh ? thisinh['gioitinh'] : '';
          m['__thisinh_phone'] = thisinh ? thisinh['phone'] : '';
          m['__thisinh_email'] = thisinh ? thisinh['email'] : '';
          m['__monthi_covered'] = this.dsMon && m.monthi_ids ? m.monthi_ids.map(b => this.dsMon.find(f => f.id == b) ? this.dsMon.find(f => f.id == b) : []) : [];

          return m;
        })

        this.notifi.isProcessing(false);
      },
      error: () => {
        this.isLoading = true;

        this.notifi.isProcessing(true);
        this.notifi.toastError('Load dữ liệu không thành công');
      }
    })
  }


  ConverDataOrder(order: OrdersTHPT[]) {
    const mergedData = order.reduce((acc, curr) => {
      const foundIndex = acc.findIndex(item => item.thisinh_id === curr.thisinh_id);
      if (foundIndex !== -1) {
        const uniqueMonIds = [...new Set([...acc[foundIndex].mon_id, ...curr.mon_id])];
        acc[foundIndex].mon_id = uniqueMonIds;
      } else {
        acc.push({...curr});
      }
      return acc;
    }, []);

    return mergedData;
  }


  selectDataOrder(event) {
    if (event.checked === true) {
      this.dataOrderSelect = this.dataOrderThpt;
    } else {
      this.dataOrderSelect = [];
    }
    this.emitDataChanges()

  }

  selectDataThisinh(event) {
    if (event.checked === true) {
      this.dataThiSinhSelect = this.listData;
    } else {
      this.dataThiSinhSelect = [];
    }
    this.emitDataChanges()
  }

  async btnAddHoidong() {
    if (this.dataOrderSelect.length > 0) {
      const dataCreate = this.dataOrderSelect.map(m => {
        return {thisinh_id: m.thisinh_id, monthi_ids: m.mon_id, hoidong_id: this.hoidong_id};
      })

      this.processItems(dataCreate);
      this.dataOrderSelect = [];
    } else {

      this.notifi.toastError('Vui lòng chọn thí sinh đăng ký');
    }
  }

  async processItems(dataCreate: any) {
    const requests$: Observable<any>[] = [];
    this.isloading = true;
    this.modalService.open(this.templateWaiting, WAITING_POPUP);
    dataCreate.forEach((r, index) => {

      const request$ =
        this.hoiDongThiSinhService.create(r).pipe(concatMap((id) => {
            return of(null);
          }), delay(index * 500), catchError(error => {
            console.error(error);
            return of(null);
          })
        );

      requests$.push(request$);
    });

    forkJoin(requests$).pipe(
      finalize(() => {
        this.modalService.dismissAll();
        this.loadData();
        this.isloading = false;
        this.emitDataChanges()
      })
    ).subscribe();
  }


  async btndelete() {

    if (this.dataThiSinhSelect && this.dataThiSinhSelect.length) {
      const confirm = await this.notifi.confirmDelete();
      if (confirm) {
        try {
          this.modalService.open(this.templateWaiting, WAITING_POPUP);
          this.startDeletes();
          this.emitDataChanges()

        } catch (error) {
          this.notifi.isProcessing(false);
          this.notifi.toastError('Thao tác không thành công');
        }
      }
    } else {
      this.notifi.toastError('Vui lòng chọn thí sinh ');
    }
  }


  private startDeletes() {
    if (this.dataThiSinhSelect.length) {
      const row: ThptHoiDongThiSinh = this.dataThiSinhSelect.pop();
      this.hoiDongThiSinhService.delete(row.id).subscribe({
        next: () => {
          this.listData = this.listData.filter(u => row.id !== u.id);
          this.startDeletes();
          this.dataThiSinhSelect = this.dataThiSinhSelect.filter(f => f.id !== row.id);
        },
        error: () => {
          this.listData = this.listData.filter(u => row.id !== u.id);
          this.startDeletes();
        },
      })
    } else {
      this.notifi.isProcessing(false);
      this.loadInit();
      this.modalService.dismissAll();

    }
  }


  emitDataChanges() {
    this.onDataChange.emit({orderSelect: this.dataOrderSelect.length, thisinhSelect: this.dataThiSinhSelect.length});
  }

  btnDataSelect(event){
    this.emitDataChanges()
  }

}
