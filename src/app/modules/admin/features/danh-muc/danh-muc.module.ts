import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {DanhMucRoutingModule} from './danh-muc-routing.module';
import {SharedModule} from '@shared/shared.module';
import {ButtonModule} from 'primeng/button';
import {RippleModule} from 'primeng/ripple';
import {ReactiveFormsModule} from '@angular/forms';
import {DropdownModule} from 'primeng/dropdown';
import {PaginatorModule} from 'primeng/paginator';
import {InputMaskModule} from 'primeng/inputmask';
import {DialogModule} from 'primeng/dialog';
import { EditorModule } from 'primeng/editor'
import { ContextMenuModule } from 'primeng/contextmenu';
import { MultiSelectModule } from 'primeng/multiselect';

import { ChuyenMucComponent } from './chuyen-muc/chuyen-muc.component';
import { LinhVucComponent } from './linh-vuc/linh-vuc.component';
import { LoaiNguLieuComponent } from './loai-ngu-lieu/loai-ngu-lieu.component';
import { DiemDiTichComponent } from './diem-di-tich/diem-di-tich.component';

import {SplitterModule} from "primeng/splitter";
import Quill from 'quill';
import ImageResize from 'quill-image-resize-module';
import { MonComponent } from './mon/mon.component';
import { ToHopMonComponent } from './to-hop-mon/to-hop-mon.component';
import { DotThiComponent } from './dot-thi/dot-thi.component';
import {CalendarModule} from "primeng/calendar";
import { TruongHocComponent } from './truong-hoc/truong-hoc.component';
import { LePhiThiComponent } from './le-phi-thi/le-phi-thi.component';
import {InputTextModule} from "primeng/inputtext";
Quill.register('modules/imageResize', ImageResize);

@NgModule({
  declarations: [
    ChuyenMucComponent,
    LinhVucComponent,
    LoaiNguLieuComponent,
    DiemDiTichComponent,
    MonComponent,
    ToHopMonComponent,
    DotThiComponent,
    TruongHocComponent,
    LePhiThiComponent,

  ],
    imports: [
        CommonModule,
        DanhMucRoutingModule,
        SharedModule,
        ButtonModule,
        RippleModule,
        ReactiveFormsModule,
        DropdownModule,
        PaginatorModule,
        InputMaskModule,
        DialogModule,
        EditorModule,
        ContextMenuModule,
        MultiSelectModule,
        SplitterModule,
        CalendarModule,
        InputTextModule
    ]
})
export class DanhMucModule {
}
