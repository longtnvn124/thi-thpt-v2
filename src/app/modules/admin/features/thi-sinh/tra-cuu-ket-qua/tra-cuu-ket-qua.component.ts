import { Component, OnInit } from '@angular/core';
import {ThptKetqua, ThptKetquaService} from "@shared/services/thpt-ketqua.service";
import {ThisinhInfoService} from "@shared/services/thisinh-info.service";
import {KeHoachThi, ThptKehoachThiService} from "@shared/services/thpt-kehoach-thi.service";
import {forkJoin} from "rxjs";
import {ThiSinhInfo} from "@shared/models/thi-sinh";
import {AuthService} from "@core/services/auth.service";
import {NotificationService} from "@core/services/notification.service";
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {DmMon} from "@shared/models/danh-muc";
import {ExportToPdfService} from "@shared/services/export-to-pdf.service";

@Component({
  selector: 'app-tra-cuu-ket-qua',
  templateUrl: './tra-cuu-ket-qua.component.html',
  styleUrls: ['./tra-cuu-ket-qua.component.css']
})
export class TraCuuKetQuaComponent implements OnInit {
  thisinhInfo:ThiSinhInfo;
  kehoachThi:KeHoachThi[] = [];
  kehoach_id_select:number;
  isLoadding:boolean = false;
  dsKetqua:ThptKetqua[];
  isLoading :boolean =false;
  dmMon:DmMon[];
  constructor(
    private ketquaService:ThptKetquaService,
    private thisinhInfoSerice:ThisinhInfoService,
    private thptKehoachThiService:ThptKehoachThiService,
    private auth:AuthService,
    private notifi:NotificationService,
    private danhMucMonService:DanhMucMonService,
    private exportToPdfService:ExportToPdfService
  ) { }

  ngOnInit(): void {
    this.loadInit()
  }

  loadInit(){
    this.notifi.isProcessing(true);

    forkJoin<[DmMon[], ThiSinhInfo,KeHoachThi[]]>(
      this.danhMucMonService.getDataUnlimit(),
      this.thisinhInfoSerice.getUserInfo(this.auth.user.id),
      this.thptKehoachThiService.getDataUnlimitNotstatus()
    ).subscribe({
      next:([dmMon,thisinhInfo, kehoachthi])=>{

        this.thisinhInfo= thisinhInfo;
        this.kehoachThi = kehoachthi;
        console.log(this.thisinhInfo)
        console.log(this.kehoachThi)
        this.notifi.isProcessing(false)
      },error:(e)=>{
        this.notifi.isProcessing(false)
      }
    })
  }

  btnSearchData(){
    this.notifi.isProcessing( true)
    this.isLoadding = true;
    if(this.thisinhInfo && this.kehoach_id_select  ){
      this.ketquaService.getdataBythisinhIdAndKehoachId(this.thisinhInfo.id, this.kehoach_id_select).subscribe({
        next:(data)=>{
          console.log(data)

          this.dsKetqua = data.map((m,index)=>{
            m['__index'] = index+1;
            return m;
          });
          this.isLoadding = false;
          this.notifi.isProcessing(false);
        },error:(e)=>{
          this.isLoadding = false;
          this.notifi.isProcessing(false);

        }
      })
    }else{
      this.isLoadding = false;
      this.notifi.isProcessing(false);
      this.notifi.toastWarning('Vui lòng chọn đợt thi ')
    }
  }

  changeDotthi(event){
    this.kehoach_id_select = event.value;
  }

  btnXuatPdf(){

  }

  getfile(){
    this.exportToPdfService.textToPDF()
  }
}
