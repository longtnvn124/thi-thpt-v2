import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { ThptHoiDong } from '@modules/shared/services/thpt-hoi-dong.service';
import { Paginator } from 'primeng/paginator';
import { EmployeesPickerService } from "@shared/services/employees-picker.service";

import { ThptOrdersService } from "@shared/services/thpt-orders.service";

@Component({
  selector: 'app-add-thi-sinh',
  templateUrl: './add-thi-sinh.component.html',
  styleUrls: ['./add-thi-sinh.component.css']
})
export class AddThiSinhComponent implements OnInit {

  @Input() hoidong_id: number;
  @Input() kehoach_id: number;
  @ViewChild(Paginator) paginator: Paginator;
  @ViewChild('templateWaiting') templateWaiting: ElementRef;
  hoiDongData: ThptHoiDong;
  TypeChangePage: 0 | 1 | 2 | 3 = 0; // 0: not data room//1:have data room //3:showDataroom

  constructor(
    private pickker: EmployeesPickerService,
    private orderSerivce: ThptOrdersService
  ) { }

  ngOnInit(): void {
  }

  async btnAddNew() {
    // this.pickker.pickerUser([], this.kehoach_id)
    const result = await this.pickker.pickerUser([], this.kehoach_id);
    console.log(result);

    if (result) {

      const thisinh_ids = Array.from(result);
      console.log(thisinh_ids);

      thisinh_ids.forEach(f => {

      })
    }


  }
}
