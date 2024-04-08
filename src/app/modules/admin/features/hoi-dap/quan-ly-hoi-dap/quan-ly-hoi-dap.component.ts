import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormType, NgPaginateEvent, OvicForm, OvicTableStructure} from "@shared/models/ovic-models";

import {HoiDapTHPT, ThptHoiDapService} from "@shared/services/thpt-hoi-dap.service";
import {Paginator} from "primeng/paginator";
import {FormBuilder, FormGroup} from "@angular/forms";
import {debounceTime, filter, Observable, Subject, Subscription} from "rxjs";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {NotificationService} from "@core/services/notification.service";

interface FormHoiDap extends OvicForm {
  object: HoiDapTHPT;
}

@Component({
  selector: 'app-quan-ly-hoi-dap',
  templateUrl: './quan-ly-hoi-dap.component.html',
  styleUrls: ['./quan-ly-hoi-dap.component.css']
})
export class QuanLyHoiDapComponent implements OnInit {
  @ViewChild('fromUpdate', {static: true}) template: TemplateRef<any>;
  @ViewChild(Paginator) paginator: Paginator;
  listData: HoiDapTHPT[];
  statusList = [
    {
      value: 1,
      label: 'Active',
      color: '<span class="badge badge--size-normal badge-success w-100">Active</span>'
    },
    {
      value: 0,
      label: 'Inactive',
      color: '<span class="badge badge--size-normal badge-danger w-100">Inactive</span>'
    }
  ];
  tblStructure: OvicTableStructure[] = [
    {
      fieldType: 'normal',
      field: ['__ten_converted'],
      innerData: true,
      header: 'Tên',
      sortable: false
    },

    {
      fieldType: 'normal',
      field: ['__status'],
      innerData: true,
      header: 'Trạng thái',
      sortable: false,
      headClass: 'ovic-w-110px text-center',
      rowClass: 'ovic-w-110px text-center'
    },
    {
      tooltip: '',
      fieldType: 'buttons',
      field: [],
      rowClass: 'ovic-w-110px text-center',
      checker: 'fieldName',
      header: 'Thao tác',
      sortable: false,
      headClass: 'ovic-w-120px text-center',
      buttons: [
        {
          tooltip: 'Sửa',
          label: '',
          icon: 'pi pi-file-edit',
          name: 'EDIT_DECISION',
          cssClass: 'btn-primary rounded'
        },
        {
          tooltip: 'Xoá',
          label: '',
          icon: 'pi pi-trash',
          name: 'DELETE_DECISION',
          cssClass: 'btn-danger rounded'
        }
      ]
    }
  ];

  headButtons = [
    {
      label: 'Thêm mới câu hỏi đáp',
      name: 'BUTTON_ADD_NEW',
      icon: 'pi-plus pi',
      class: 'p-button-rounded p-button-success ml-3 mr-2'
    },
  ];
  listForm = {
    [FormType.ADDITION]: {type: FormType.ADDITION, title: 'Thêm mới câu hỏi đáp', object: null, data: null},
    [FormType.UPDATE]: {type: FormType.UPDATE, title: 'Cập nhật câu hỏi đáp', object: null, data: null}
  };
  formActive: FormHoiDap;
  formSave: FormGroup;

  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormHoiDap>();

  rows = this.themeSettingsService.settings.rows;
  loadInitFail = false;
  subscription = new Subscription();
  sizeFullWidth = 1024;
  isLoading = true;
  needUpdate = false;

  menuName: 'hoi-dap';

  page = 1;
  btn_checkAdd: 'Lưu lại' | 'Cập nhật';
  recordsTotal = 0;

  index = 1;
  search:string= '';
  constructor(
    private themeSettingsService :ThemeSettingsService,
    private hoidapService:ThptHoiDapService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
  ) {
    const observeProcessFormData = this.OBSERVE_PROCESS_FORM_DATA.asObservable().pipe(debounceTime(100)).subscribe(form => this.__processFrom(form));
    this.subscription.add(observeProcessFormData);
    const observeProcessCloseForm = this.notificationService.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData(this.page));
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notificationService.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
  }

  ngOnInit(): void {
    this.loadInit()

  }
  loadInit() {
    this.isLoading = true;
    this.loadData(1);
  }
  loadData(page:number, search?:string) {
    const limit = this.themeSettingsService.settings.rows;
    this.index = (page * limit) - limit + 1;
    this.search = search? search : this.search;
    this.hoidapService.search(page, null, this.search).subscribe({
      next: ({data, recordsTotal}) => {
        this.recordsTotal = recordsTotal;
        this.listData = data.map(m => {
          const sIndex = this.statusList.findIndex(i => i.value === m.status);
          m['__status'] = sIndex !== -1 ? this.statusList[sIndex].color : '';
          m['__ten_converted'] = `<b>${m.question}</b><br>` ;
          return m;
        })
        this.isLoading = false;
      }, error: () => {
        this.isLoading = false;
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }

  private __processFrom({data, object, type}: FormHoiDap) {
    const observer$: Observable<any> = type === FormType.ADDITION ? this.hoidapService.create(data) : this.hoidapService.update(object.id, data);
    observer$.subscribe({
      next: () => {
        this.needUpdate = true;
        this.loadData(1,'');
        this.notificationService.toastSuccess('Thao tác thành công', 'Thông báo');
      },
      error: () => {
        this.notificationService.toastError('Thao tác thất bại', 'Thông báo')
      }
    });
  }

  paginate({page}: NgPaginateEvent) {
    this.page = page + 1;
    this.loadData(this.page);
  }

  onSearch(text: string) {
    this.search = text;
    this.paginator.changePage(1);
    this.loadData(1, text);
  }

}
