import { observable } from 'rxjs';
import { ThptOrdersService } from '@shared/services/thpt-orders.service';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { ThemeSettingsService } from '@core/services/theme-settings.service';
import { OrdersTHPT } from '@modules/shared/services/thpt-orders.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ThiSinhService } from '@modules/shared/services/thi-sinh.service';

@Component({
  selector: 'app-ovic-picker-candidation',
  templateUrl: './ovic-picker-candidation.component.html',
  styleUrls: ['./ovic-picker-candidation.component.css']
})
export class OvicPickerCandidationComponent implements OnInit {
  @Input() select = 'id,donvi_id,title,loaingulieu,linhvuc,chuyenmuc,file_media';
  @Input() user_ids: number[] = [];
  @Input() kehoach_id: number;
  _OrderUsers: OrdersTHPT[] = [];
  formGroup: FormGroup;
  page: number = 1;
  isLoading: boolean = false;
  loadFail: boolean = false;

  recordsTotal: number;
  rows: number = this.themeSettingsService.settings.rows;;
  data: OrdersTHPT[] = [];

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private themeSettingsService: ThemeSettingsService,
    private helperService: HelperService,
    private auth: AuthService,
    private notificationService: NotificationService,
    private ordersService: ThptOrdersService,

  ) { }

  ngOnInit(): void {
    this.loadData();
  }



  loadData() {
    this.isLoading = true;

    this.ordersService.getdataByNotThisinhIds(this.page, this.user_ids, this.kehoach_id).subscribe({
      next: ({ data, recordsTotal }) => {
        console.log(data);
        this.data = data.map(m => {
          const thisinh = m['thisinh'];
          m['_hoten'] = thisinh ? thisinh['hoten'] : '';
          m['_phone'] = thisinh ? thisinh['phone'] : '';
          m['_email'] = thisinh ? thisinh['email'] : '';
          m['_ngaysinh'] = thisinh ? thisinh['ngaysinh'] : '';
          m['_cccd_so'] = thisinh ? thisinh['cccd_so'] : '';
          m['_gioitinh'] = thisinh && thisinh['gioitinh'] === 'nam' ? 'Nam' : 'Nữ';
          return m;
        });
        this.recordsTotal = recordsTotal;
        this.isLoading = false;
        this.loadFail = false;

      }, error: () => {
        this.isLoading = false;
        this.loadFail = false;
      }
    })
  }

  close() {
    this.activeModal.close([]);
  }

  paginate({ page }: { page: number }) {
    this.page = page + 1;
    this.loadData();
  }


  save() {
    console.log(this._OrderUsers);

    const thisinh_ids = new Set(this._OrderUsers.map(m => m.thisinh_id));
    console.log(thisinh_ids);

    this.activeModal.close(thisinh_ids);
  }
}
