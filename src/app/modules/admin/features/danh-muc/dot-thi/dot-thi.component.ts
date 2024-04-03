import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormType, NgPaginateEvent, OvicForm, OvicTableStructure} from "@shared/models/ovic-models";
import {DmDotThi, DmMon} from "@shared/models/danh-muc";
import {Paginator} from "primeng/paginator";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {debounceTime, filter, Observable, Subject, Subscription} from "rxjs";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {NotificationService} from "@core/services/notification.service";
import {AuthService} from "@core/services/auth.service";
import {HelperService} from "@core/services/helper.service";
import {DanhMucMonService} from "@shared/services/danh-muc-mon.service";
import {DanhMucDotThiService} from "@shared/services/danh-muc-dot-thi.service";
import {OvicButton} from "@core/models/buttons";


interface FormDotThi extends OvicForm {
  object: DmDotThi;
}

@Component({
  selector: 'app-dot-thi',
  templateUrl: './dot-thi.component.html',
  styleUrls: ['./dot-thi.component.css']
})
export class DotThiComponent implements OnInit {

  @ViewChild('fromUpdate', {static: true}) template: TemplateRef<any>;
  @ViewChild('formMembers', {static: true}) formMembers: TemplateRef<any>;
  @ViewChild(Paginator) paginator: Paginator;
  listData: DmDotThi[];

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
      field: ['ten_dotthi'],
      innerData: true,
      header: 'Tên đợt thi',
      sortable: false
    },
    {
      fieldType: 'normal',
      field: ['__time_converted'],
      innerData: true,
      header: 'Thời gian',
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
      label: 'Thêm đợt thi',
      name: 'BUTTON_ADD_NEW',
      icon: 'pi-plus pi',
      class: 'p-button-rounded p-button-success ml-3 mr-2'
    },
  ];

  listForm = {
    [FormType.ADDITION]: {type: FormType.ADDITION, title: 'Thêm mới đợt thi', object: null, data: null},
    [FormType.UPDATE]: {type: FormType.UPDATE, title: 'Cập nhật đợt thi', object: null, data: null}
  };

  formActive: FormDotThi;
  formSave: FormGroup;

  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormDotThi>();

  rows = this.themeSettingsService.settings.rows;
  loadInitFail = false;
  subscription = new Subscription();
  sizeFullWidth = 1024;
  isLoading = true;
  needUpdate = false;
  menuName: 'dm_dotthi';
  page = 1;
  btn_checkAdd: 'Lưu lại' | 'Cập nhật';
  recordsTotal = 0;

  index = 1;
  search='';
  constructor(
    private themeSettingsService: ThemeSettingsService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private auth: AuthService,
    private helperService: HelperService,
    private danhMucDotThiService: DanhMucDotThiService
  ) {
    this.formSave = this.fb.group({
      ten_dotthi: ['', Validators.required],
      time_start: [null, Validators.required],
      time_end: [null, Validators.required],
      status: [null, Validators.required],
    });

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
    let newsearch:string = search? search : this.search;
    this.danhMucDotThiService.search(page, newsearch).subscribe({
      next: ({data, recordsTotal}) => {
        this.recordsTotal = recordsTotal;
        this.listData = data.map(m => {
          const sIndex = this.statusList.findIndex(i => i.value === m.status);
          m['__time_converted'] = this.strToTime(m.time_start) + ' - ' + this.strToTime(m.time_end);
          m['__status'] = sIndex !== -1 ? this.statusList[sIndex].color : '';
          return m;
        })
        console.log(this.listData);
        this.isLoading = false;
      }, error: () => {
        this.isLoading = false;
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }
  private __processFrom({data, object, type}: FormDotThi) {
    const observer$: Observable<any> = type === FormType.ADDITION ? this.danhMucDotThiService.create(data) : this.danhMucDotThiService.update(object.id, data);
    observer$.subscribe({
      next: () => {
        this.needUpdate = true;
        this.page = 1;
        this.loadData(1, this.search);
        this.notificationService.toastSuccess('Thao tác thành công', 'Thông báo');
      },
      error: () => this.notificationService.toastError('Thao tác thất bại', 'Thông báo')
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
  private preSetupForm(name: string) {
    this.notificationService.isProcessing(false);
    this.notificationService.openSideNavigationMenu({
      name,
      template: this.template,
      size: 600,
      offsetTop: '0px'
    });
  }

  closeForm() {
    this.loadInit();
    this.notificationService.closeSideNavigationMenu(this.menuName);
  }

  async handleClickOnTable(button: OvicButton) {
    if (!button) {
      return;
    }
    const decision = button.data && this.listData ? this.listData.find(u => u.id === button.data) : null;
    switch (button.name) {
      case 'BUTTON_ADD_NEW':
        this.btn_checkAdd = "Lưu lại";
        this.formSave.reset({
          ten_dotthi: '',
          time_start: null,
          time_end: null,
          status: 1,

        });
        this.formActive = this.listForm[FormType.ADDITION];
        this.preSetupForm(this.menuName);
        break;
      case 'EDIT_DECISION':
        this.btn_checkAdd = "Cập nhật";

        const object1 = this.listData.find(u => u.id === decision.id);
        this.formSave.reset({
          ten_dotthi: object1.ten_dotthi,
          time_start: object1.time_start,
          time_end: object1.time_end,
          status: object1.status,

        })
        this.formActive = this.listForm[FormType.UPDATE];
        this.formActive.object = object1;
        this.preSetupForm(this.menuName);
        break;
      case 'DELETE_DECISION':
        const confirm = await this.notificationService.confirmDelete();
        if (confirm) {
          this.danhMucDotThiService.delete(decision.id).subscribe({
            next: () => {
              this.page = Math.max(1, this.page - (this.listData.length > 1 ? 0 : 1));
              this.notificationService.isProcessing(false);
              this.notificationService.toastSuccess('Thao tác thành công');
              this.loadData(this.page);

            }, error: () => {
              this.notificationService.isProcessing(false);
              this.notificationService.toastError('Thao tác không thành công');
            }
          })
        }
        break;
      default:
        break;
    }
  }
  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }

  saveForm() {
    const titleInput = this.f['ten_dotthi'].value.trim();
    this.f['ten_dotthi'].setValue(titleInput);
    const timeszone = this.formatSQLDateTime(new Date(this.formSave.value['time_start'])) <  this.formatSQLDateTime(new Date(this.formSave.value['time_end']));
    if (this.formSave.valid) {
      if (titleInput !== '') {
        if (timeszone){
          this.formSave.value['time_start'] = this.formatSQLDateTime(new Date(this.formSave.value['time_start']));
          this.formSave.value['time_end'] = this.formatSQLDateTime(new Date(this.formSave.value['time_end']));
          this.formActive.data = this.formSave.value;
          this.OBSERVE_PROCESS_FORM_DATA.next(this.formActive);
        }else{
          this.notificationService.toastWarning('Thời gian nhập không hợp lệ');
        }

      } else {
        this.notificationService.toastError('Vui lòng không nhập khoảng trống');
      }
    } else {
      this.formSave.markAllAsTouched();
      this.notificationService.toastError('Vui lòng nhập đủ thông tin');
    }
  }


  strToTime(input: string): string {
    const date = input ? new Date(input) : null;
    let result = '';
    if (date) {
      result += [date.getDate().toString().padStart(2, '0'), (date.getMonth() + 1).toString().padStart(2, '0'), date.getFullYear().toString()].join('/');
      result += ' ' + [date.getHours().toString().padStart(2, '0'), date.getMinutes().toString().padStart(2, '0')].join(':');
    }
    return result;
  }
  formatSQLDateTime(date: Date): string {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    const sec = '00';
    //'YYYY-MM-DD hh:mm:ss' type of sql DATETIME format
    return `${y}-${m}-${d} ${h}:${min}:${sec}`;
  }
}
