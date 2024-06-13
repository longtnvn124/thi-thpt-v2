import {Component, Input, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder} from "@angular/forms";
import {NotificationService} from "@core/services/notification.service";
import {KeHoachThi, ThptKehoachThiService} from "@shared/services/thpt-kehoach-thi.service";
import {ThptKetquaService} from "@shared/services/thpt-ketqua.service";
import {Options, ThptOptionsService} from "@shared/services/thpt-options.service";
import {forkJoin} from "rxjs";
import {InputMonthi} from "@shared/components/ovic-input-monthi/ovic-input-monthi.component";

export interface PhieuMonthiDetails{
  monthi:string;
  soluong:number;
  thanhtien:number;
}
export interface Phieumonthi {
  id?: number;
  kehoach_id: number;
  monthi: string[];
  details:PhieuMonthiDetails[]
}

@Component({
  selector: 'ovic-thpt-bill',
  templateUrl: './ovic-thpt-bill.component.html',
  styleUrls: ['./ovic-thpt-bill.component.css']
})
export class OvicThptBillComponent implements OnInit {
  @Input() thisinh_id : number;
  @Input() formField  : AbstractControl<Phieumonthi[]>;

  kehoachthi:KeHoachThi[];
  option:Options;
  dotdangky:Phieumonthi[]
  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private kehoachthiService:ThptKehoachThiService,
    private thptKetquaService:ThptKetquaService,
    private optionService:ThptOptionsService

  ) { }

  ngOnInit(): void {
    this.getDanhMuc()
    if (this.formField) {
      this.formField.valueChanges.subscribe(options => this.dotdangky = options && Array.isArray(options) ? options : []);
      this.dotdangky = this.formField.value && Array.isArray(this.formField.value) ? this.formField.value : [];
      // this.monselectName = this.DmMonThi ?  this.options.map(m=>this.DmMonThi.find(f=>f.id === m.mon_id).tenmon).join(',') : '';
    }
  }
  getDanhMuc(){
    this.notificationService.isProcessing(true);
    forkJoin<[KeHoachThi[],Options ]>(
      this.kehoachthiService.getDataUnlimit(),
      this.optionService.getdataByName('LE_PHI_PHIEU_TRA_KET_QUA')
    ).subscribe({
      next:([kehoachthi, option])=>{

        this.kehoachthi= kehoachthi;
        this.option = option
        this.notificationService.isProcessing(false)
      },
      error:()=>{
        this.notificationService.isProcessing(false)
        this.notificationService.toastError('Load dữ liệu không thành công ');
      }
    })
  }

  addMoreDothi() {
    if (this.formField) {
      const oldValue = Array.isArray(this.formField.value) ? this.formField.value : [];
      const _id = oldValue.reduce((max, item) => max < item.id ? item.id : max, 0)
      oldValue.push({id: _id + 1, kehoach_id: null, monthi: null, details: null});
      this.formField.setValue(oldValue);
    }
  }
  deleteItem(id: number) {
    if (this.dotdangky.find(f => f.id === id)) {
      this.dotdangky= this.dotdangky.filter( f=>f.id !== id);
      this.formField.setValue(this.dotdangky);
    }
  }

  changeKehoach(event, dot:Phieumonthi){
    console.log(event);
    console.log(dot);
    this.notificationService.isProcessing(true);
    this.thptKetquaService.getdataBythisinhIdAndKehoachId(this.thisinh_id ,event.value).subscribe({
      next:(data)=>{
        console.log(data);
        dot['dsKetquaMon'] = data;
        this.notificationService.isProcessing(false);
      },
      error:(e)=>{
        this.notificationService.isProcessing(false);
        dot['dsKetquaMon'] = [];

      }
    })
  }
  selectMonthiInketqua(event, dot:Phieumonthi){
    console.log(event.value)
    if(event.value === []){
      dot.details= [];
    }else{
      this.covertedDot(event.value,dot)
    }
    console.log(dot);
  }


  covertedDot(arr:string[],dop:Phieumonthi):Phieumonthi{
    const details:PhieuMonthiDetails[] = [];
    arr.forEach(item =>{
      const tenmon= item;
      const soluong = 1;
      const thanhtien = soluong  * this.option.value

      details.push({monthi:tenmon,soluong:soluong,thanhtien:thanhtien});
    })
    dop.details = details;
    return dop;
  }

  deleteMonthiInItem(monthi:string){

  }


}
