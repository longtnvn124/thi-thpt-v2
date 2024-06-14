import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ThptTraKetQua, ThptTraKetQuaService} from "@shared/services/thpt-tra-ket-qua.service";
import {NotificationService} from "@core/services/notification.service";
import {KeHoachThi, ThptKehoachThiService} from "@shared/services/thpt-kehoach-thi.service";
import {ThiSinhInfo} from "@shared/models/thi-sinh";
import {forkJoin} from "rxjs";
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {ThisinhInfoService} from "@shared/services/thisinh-info.service";
import {AuthService} from "@core/services/auth.service";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {NgPaginateEvent} from "@shared/models/ovic-models";
import {Paginator} from "primeng/paginator";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {DEFAULT_MODAL_OPTIONS} from "@shared/utils/syscat";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-yeu-cau-tra-ket-qua',
  templateUrl: './yeu-cau-tra-ket-qua.component.html',
  styleUrls: ['./yeu-cau-tra-ket-qua.component.css']
})
export class YeuCauTraKetQuaComponent implements OnInit {
  @ViewChild(Paginator)       paginator     : Paginator;
  @ViewChild('tplCreateBill') tplCreateBill : ElementRef;

  //=========================================
  kehoachthi    : KeHoachThi[];
  thisinhInfo   : ThiSinhInfo;
  listData      : ThptTraKetQua[];
  formSave      : FormGroup;
  //=========================================
  isLoading:boolean   = true;
  page:number         = 1;
  recordsTotal:number = 0;
  rows:number         = this.themeSettingsService.settings.rows;


  constructor(
    private themeSettingsService:ThemeSettingsService,
    private thptTraKetQuaService:ThptTraKetQuaService,
    private notifi:NotificationService,
    private kehoachthiService:ThptKehoachThiService,
    private dmMonService:DanhMucMonService,
    private thisinhInfoService: ThisinhInfoService,
    private auth:AuthService,
    private modalService : NgbModal,
    private fb:FormBuilder,
  ) {
    this.formSave = this.fb.group({
      ten_phieu: ['', Validators.required],
      mota: [''],
      thisinh_id: [null, Validators.required],
      hoten: [null, Validators.required],
      ngaysinh: [null, Validators.required],
      cccd_so: [null, Validators.required],
      dotdangky: [null, Validators.required],
    })
  }

  ngOnInit(): void {
    this.getDanhMuc()
  }

  getDanhMuc(){
    this.isLoading=true;

    this.notifi.isProcessing(true);

    forkJoin<[ KeHoachThi[],ThiSinhInfo]>(
      this.kehoachthiService.getDataUnlimit(),
      this.thisinhInfoService.getUserInfo(this.auth.user.id)
    ).subscribe({
      next:([kehoachthi, thisinhinfo])=>{
        this.kehoachthi = kehoachthi ;
        this.thisinhInfo = thisinhinfo;

        if( this.kehoachthi && this.thisinhInfo){
          this.loadData(this.page);
        }
        this.isLoading=false;
        this.notifi.isProcessing(false);
      },
      error:()=>{
        this.isLoading=false;
        this.notifi.isProcessing(false);
        this.notifi.toastError('Load dữ liệu không thành công')
      }
    })
  }
  loadData(page:number){
    this.isLoading=true;
    this.notifi.isProcessing(true);
    this.page = page ? page: this.page;
    this.thptTraKetQuaService.getdatabythisinhId(this.page,this.thisinhInfo.id).subscribe(
      {
        next:({recordsTotal,data})=>{

          this.recordsTotal= recordsTotal;
          this.listData = data;
          this.isLoading=false;
          this.notifi.isProcessing(false);
        },
        error:(e)=>{
          this.isLoading=false;
          this.notifi.isProcessing(false);
        }
      }
    )

  }

  paginate({page}: NgPaginateEvent) {
    this.page = page + 1;
    this.loadData(this.page);
  }
  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }

  ViewFormAdd(){
    this.formSave.reset({
      ten_phieu: 'Phiếu yêu cầu trả kết quả',
      mota: '',
      thisinh_id: this.thisinhInfo.id,
      hoten: this.thisinhInfo.hoten,
      ngaysinh: this.thisinhInfo.ngaysinh,
      cccd_so: this.thisinhInfo.cccd_so,
      dotdangky: [],
    })
    this.modalService.open(this.tplCreateBill, DEFAULT_MODAL_OPTIONS)
  }


  btnClose(){
    this.modalService.dismissAll();
  }

  resetForm(){
    this.formSave.reset({
      ten_phieu: 'Phiếu yêu cầu trả kết quả',
      mota: '',
      thisinh_id: this.thisinhInfo.id,
      hoten: this.thisinhInfo.hoten,
      ngaysinh: this.thisinhInfo.ngaysinh,
      cccd_so: this.thisinhInfo.cccd_so,
      dotdangky: [],
    })
  }
  createPhieu(){

  }


}
