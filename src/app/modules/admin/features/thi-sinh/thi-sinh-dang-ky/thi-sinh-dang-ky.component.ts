import { Component, OnInit } from '@angular/core';
import {ThisinhInfoService} from "@shared/services/thisinh-info.service";
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {DanhMucToHopMonService} from "@shared/services/danh-muc-to-hop-mon.service";
import {DanhMucDotThiService} from "@shared/services/danh-muc-dot-thi.service";

@Component({
  selector: 'app-thi-sinh-dang-ky',
  templateUrl: './thi-sinh-dang-ky.component.html',
  styleUrls: ['./thi-sinh-dang-ky.component.css']
})
export class ThiSinhDangKyComponent implements OnInit {

  constructor(
    private thisinhInfo: ThisinhInfoService,
    private monService: DanhMucMonService,
    private toHopMonService:DanhMucToHopMonService,
    private dmDotthi:DanhMucDotThiService,
  ) { }

  ngOnInit(): void {
  }

}
