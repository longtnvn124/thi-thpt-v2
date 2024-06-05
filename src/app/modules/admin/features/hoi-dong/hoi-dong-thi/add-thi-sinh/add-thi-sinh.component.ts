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
import {DanhMucPhongThiService, DmPhongThi} from "@shared/services/danh-muc-phong-thi.service";


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
  dmPhongthi :any[];

  trangthai_thanhtoan = [
    {label: ' Đã thanh toán ', value:1},
    {label: ' Chưa thanh toán', value:0},
  ]
  constructor(
    private orderSerivce: ThptOrdersService,
    private themeSettingsService: ThemeSettingsService,
    private hoiDongThiSinhService: ThptHoidongThisinhService,
    private notifi: NotificationService,
    private danhMucMonService: DanhMucMonService,
    private modalService: NgbModal,
    private danhMucPhongThiService: DanhMucPhongThiService,
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
      forkJoin<[DmPhongThi[],DmMon[]]>(this.danhMucPhongThiService.getDataUnlimit(),this.danhMucMonService.getDataUnlimit()).subscribe({
        next: ([dmPhongthi, dmMon]) => {
          this.dmPhongthi = this.convertDmPhongThi(dmPhongthi);

          this.dsMon = dmMon;
          if(this.dmPhongthi && this.dsMon){
            this.loadInit();
          }
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
      const ids = project.map(m => m.thisinh_id);
      return forkJoin<[ThptHoiDongThiSinh[], OrdersTHPT[]]>([of(project), this.orderSerivce.getDataBykehoachIdAndStatusUnlimit(this.kehoach_id, ids,this.type_select)]);
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
          m['__monthi_covered'] = this.dsMon ? m.mon_id.sort((a,b)=>a-b).map(b => this.dsMon.find(f => f.id == b) ? this.dsMon.find(f => f.id == b) : []) : [];
          return m;
        });
        this.recordsTotalOrderThpt = this.dataOrderThpt.length;
        this.listData = dataThiSinh.sort((a,b)=>b.monthi_ids.length -a.monthi_ids.length).map((m, index) => {
          const thisinh = m['thisinh'];
          m['_indexTable'] = index + 1;

          m['__thisinh_hoten'] = thisinh ? thisinh['hoten'] : '';
          m['__thisinh_phone'] = thisinh ? thisinh['phone'] : '';
          m['__thisinh_cccd'] = thisinh ? thisinh['cccd_so'] : '';
          m['__thisinh_ngaysinh'] = thisinh ? thisinh['ngaysinh'] : '';
          m['__thisinh_gioitinh'] = thisinh ? thisinh['gioitinh'] : '';
          m['__thisinh_phone'] = thisinh ? thisinh['phone'] : '';
          m['__thisinh_email'] = thisinh ? thisinh['email'] : '';
          m['__monthi_covered'] = this.dsMon && m.monthi_ids ? m.monthi_ids.sort((a,b)=>a-b).map(b => this.dsMon.find(f => f.id == b) ? this.dsMon.find(f => f.id == b) : []) : [];

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

    return mergedData.sort((a,b)=> b.mon_id.length - a.mon_id.length);
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
      // const dataCreate = this.dataOrderSelect.map(m => {
      //   return {thisinh_id: m.thisinh_id, monthi_ids: m.mon_id, hoidong_id: this.hoidong_id};
      // })

      const dataCreate = this.setUpData(this.dmPhongthi,this.dataOrderSelect).map(data=>{
        return {hoidong_id:this.hoidong_id,thisinh_id:data.thisinh_id,monthi_ids:data.mon_id,phongthi:data['phongthi'],ca_th:data['ca_th'],ca_vl:data['ca_vl'],ca_hh:data['ca_hh'],ca_sh:data['ca_sh'], ca_ls:data['ca_ls'],ca_dl:data['ca_dl'],ca_ta:data['ca_ta']};
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
        this.hoiDongThiSinhService.create(r).pipe(concatMap((id) => {return of(null);}),
          delay(index * 150),
          catchError(error => {
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

  type_select:number =1 ;
  drdSelectTrangThai(event){

    this.type_select = event.value;
    this.loadData();
  }

  //====================Dm Phongthi=============================
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
  setUpData(dataphongthi: { phongso: number, soluong }[], dsthisinh: OrdersTHPT[]) {
    let indexRoom = 0;
    for (let ts = 0; ts < dsthisinh.length; ts++) {
      let total = 0;
      if(dsthisinh[ts].mon_id[0]=== 1){
        total = 0
      }else{
        total = 1
      }
      this.dsMon.forEach(mon=>{
        if(dsthisinh[ts].mon_id.find(f=>f === mon.id)){
          total = total+1;
          dsthisinh[ts]['ca_' +mon.kyhieu.toLowerCase()] = total;
        }else
        {
          dsthisinh[ts]['ca_' +mon.kyhieu.toLowerCase()] = 0
        }
      })
    }

    return dsthisinh;
  }

  coverthisinhParramnotMath( thisinhInHoidong:ThptHoiDongThiSinh[]){
    const ids:number[] = [];
    const dsThisinhParram = [];
    thisinhInHoidong.forEach(m => {
      if (m.monthi_ids.find(f => f === 1)) {
        ids.push(m.id);
        dsThisinhParram.push(m);
      }
    })
    const DsThisinhNotToant = thisinhInHoidong.filter(thiSinh => !ids.includes(thiSinh.id));
    return [].concat(dsThisinhParram,DsThisinhNotToant);
  }

  sortRoomByThisinhs(dataphongthi: { phongso: number, soluong }[],dsthisinh:ThptHoiDongThiSinh[]){
    const phongCanthiet = dataphongthi.map(phong => {

      return {phongso: phong.phongso, soluong: phong.soluong, thisinh_ids: [], soluong_thucte: 0, created: false}
    });
    let indexRoom = 0;

    const dscovert = this.coverthisinhParramnotMath(dsthisinh);


    for (let ts = 0; ts < dscovert.length; ts++) {
      const ts_id = dscovert[ts].thisinh_id;
      const dk1 = phongCanthiet[indexRoom].soluong
      const dk2 = phongCanthiet[indexRoom].thisinh_ids.length;
      if (dk2 >= dk1) {
        indexRoom++;
      }
      phongCanthiet[indexRoom].thisinh_ids.push(ts_id);
      dscovert[ts]['phongthi'] = indexRoom+1
      let total = 0;
      this.dsMon.forEach(mon=>{
        if(dscovert[ts].monthi_ids.find(f=>f === mon.id)){
          if(dscovert[ts].monthi_ids.find(a=>a===1)){
          total =total+1;
          }else{
            total =total+2;
          }
          dscovert[ts]['ca_' +mon.kyhieu.toLowerCase()] = total
        }
      })
    }

    return dscovert;
  }

  btnXepphong(){
    if(this.dataThiSinhSelect.length>0){
      const dataUpphong =  this.sortRoomByThisinhs(this.dmPhongthi, this.dataThiSinhSelect)
      this.upDatePhongthi(dataUpphong);
    }else{
      this.notifi.toastWarning('vui lòng chọn thí sinh để xếp phòng thi');
    }
  }

  async upDatePhongthi(dataCreate: ThptHoiDongThiSinh[]) {
    const requests$: Observable<any>[] = [];
    this.isloading = true;
    this.notifi.isProcessing(true);
    this.modalService.open(this.templateWaiting, WAITING_POPUP);
    dataCreate.forEach((r, index) => {
      const request$ =
        this.hoiDongThiSinhService.update(r.id ,{phongthi: r['phongthi']}).pipe(concatMap((id) => {return of(null);}),
          delay(index * 150),
          catchError(error => {
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
    ).subscribe({
      next:(data)=>{
        this.notifi.isProcessing(false);
        this.notifi.toastSuccess('Thao tác thành công');
      },
      error:(e)=>{
        this.notifi.isProcessing(false);
        this.notifi.toastError("Cập nhật phòng thi cho thí sinh không thành công");
      }
    });
  }
}
