import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormType, NgPaginateEvent, OvicForm, OvicTableStructure} from "@shared/models/ovic-models";
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators} from "@angular/forms";
import {KeHoachThi, ThptKehoachThiService} from "@shared/services/thpt-kehoach-thi.service";
import {Paginator} from "primeng/paginator";
import {debounceTime, filter, Observable, Subject, Subscription} from "rxjs";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {NotificationService} from "@core/services/notification.service";
import {OvicButton} from "@core/models/buttons";
interface FormKehoachthi extends OvicForm {
  object: KeHoachThi;
}
// const PinableValidator = (control: AbstractControl): ValidationErrors | null => {
//   if (control.get('ten').valid && control.get('ten').value) {
//     return control.get('ten').value.trim().length >0 ? null :{invalid:true };
//   } else {
//     return {invalid: true};
//   }
// }

@Component({
  selector: 'app-ke-hoach-thi',
  templateUrl: './ke-hoach-thi.component.html',
  styleUrls: ['./ke-hoach-thi.component.css']
})
export class KeHoachThiComponent implements OnInit {
  @ViewChild('fromUpdate', {static: true}) template: TemplateRef<any>;
  @ViewChild('formMembers', {static: true}) formMembers: TemplateRef<any>;
  @ViewChild(Paginator) paginator: Paginator;
  listData: KeHoachThi[];
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
      field: ['soluong_toida'],
      innerData: true,
      header: 'Số lượng đăng ký tối đa/ mỗi môn thi',
      sortable: false,
      rowClass: 'text-right text-center',
      headClass: 'text-center',
    },
    {
      fieldType: 'normal',
      field: ['ngaythi'],
      innerData: true,
      header: 'Ngày thi',
      sortable: false,
      rowClass: 'ovic-w-200px text-center',
      headClass: 'ovic-w-200px text-center',
    },
    {
      fieldType: 'normal',
      field: ['__time_coverted'],
      innerData: true,
      header: 'Thời hạn đăng ký',
      sortable: false,
      rowClass: 'ovic-w-200px text-center',
      headClass: 'ovic-w-200px text-center',
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
      label: 'Thêm đợt thi ',
      name: 'BUTTON_ADD_NEW',
      icon: 'pi-plus pi',
      class: 'p-button-rounded p-button-success ml-3 mr-2'
    },
  ];
  listForm = {
    [FormType.ADDITION]: {type: FormType.ADDITION, title: 'Thêm mới đợt thi', object: null, data: null},
    [FormType.UPDATE]: {type: FormType.UPDATE, title: 'Cập nhật đợt thi', object: null, data: null}
  };
  formActive: FormKehoachthi;
  formSave: FormGroup;

  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormKehoachthi>();

  rows = this.themeSettingsService.settings.rows;
  loadInitFail = false;
  subscription = new Subscription();
  sizeFullWidth = 1024;
  isLoading = true;
  needUpdate = false;

  menuName: 'ke-hoach-thi';

  page = 1;
  btn_checkAdd: 'Lưu lại' | 'Cập nhật';
  recordsTotal = 0;

  index = 1;
  search = '';

  constructor(
    private themeSettingsService: ThemeSettingsService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private kehoachThiService: ThptKehoachThiService
  ) {
    const observeProcessFormData = this.OBSERVE_PROCESS_FORM_DATA.asObservable().pipe(debounceTime(100)).subscribe(form => this.__processFrom(form));
    this.subscription.add(observeProcessFormData);
    const observeProcessCloseForm = this.notificationService.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData(this.page));
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notificationService.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);
    this.formSave = this.fb.group({
      nam: [null, Validators.required],
      dotthi: ['', Validators.required],
      soluong_toida:[0, Validators.required],
      ngaybatdau:['',Validators.required],
      ngayketthuc:['',Validators.required],
      mota:[''],
      ngaythi:['',Validators.required],
      status: 1,
    });
  }

  ngOnInit(): void {
    this.loadInit()
  }

  loadInit() {
    this.isLoading = true;
    this.loadData(1);
  }

  loadData(page: number, search?: string) {
    const limit = this.themeSettingsService.settings.rows;
    this.index = (page * limit) - limit + 1;
    let newsearch: string = search ? search : this.search;
    this.kehoachThiService.search(page, newsearch).subscribe({
      next: ({data, recordsTotal}) => {
        this.recordsTotal = recordsTotal;
        this.listData = data.map(m => {
          m['__ten_converted'] = `<b>${m.dotthi}</b><br>`;
          // m['__value_converted'] = m.value + ' VNĐ';
          const sIndex = this.statusList.findIndex(i => i.value === m.status);
          m['__status'] = sIndex !== -1 ? this.statusList[sIndex].color : '';
          m['__time_coverted'] =  this.strToTime(m.ngaybatdau) + ' - ' + this.strToTime(m.ngayketthuc);
          return m;
        })
        this.isLoading = false;
      }, error: () => {
        this.isLoading = false;
        this.notificationService.toastError('Mất kết nối với máy chủ');
      }
    })
  }

  private __processFrom({data, object, type}: FormKehoachthi) {
    const observer$: Observable<any> = type === FormType.ADDITION ? this.kehoachThiService.create(data) : this.kehoachThiService.update(object.id, data);
    observer$.subscribe({
      next: () => {
        this.needUpdate = true;
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
      size: 1024,
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
        const years = new Date()
        this.btn_checkAdd = "Lưu lại";
        this.formSave.reset({
          nam: years.getFullYear(),
          dotthi: '',
          soluong_toida:'',
          mota:'',
          status: 1,
          ngaybatdau: '',
          ngayketthuc: '',
          ngaythi:''

        });
        this.formActive = this.listForm[FormType.ADDITION];
        this.preSetupForm(this.menuName);
        break;
      case 'EDIT_DECISION':
        this.btn_checkAdd = "Cập nhật";
        const object1 = this.listData.find(u => u.id === decision.id);

        this.formActive = this.listForm[FormType.UPDATE];
        this.formActive.object = object1;
        this.preSetupForm(this.menuName);
        this.formSave.reset({
          nam:object1.nam,
          dotthi:object1.dotthi,
          soluong_toida:object1.soluong_toida,
          mota:object1.mota,
          status:object1.status,
          ngaythi:object1.ngaythi,
          ngaybatdau: object1.ngaybatdau ? new Date(object1.ngaybatdau) : null,
          ngayketthuc:object1.ngayketthuc ? new Date(object1.ngayketthuc) : null,
        })


        break;
      case 'DELETE_DECISION':
        const confirm = await this.notificationService.confirmDelete();
        if (confirm) {
          this.kehoachThiService.delete(decision.id).subscribe({
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

    const titleInput = this.f['dotthi'].value.trim();
    this.f['dotthi'].setValue(titleInput);
    const timeszone = this.formatSQLDateTime(new Date(this.formSave.value['ngaybatdau'])) <  this.formatSQLDateTime(new Date(this.formSave.value['ngayketthuc']));
    if (this.formSave.valid) {
      if (titleInput !== '') {
        if (timeszone){
          this.formSave.value['ngaybatdau'] = this.formatSQLDateTime(new Date(this.formSave.value['ngaybatdau']));
          this.formSave.value['ngayketthuc'] = this.formatSQLDateTime(new Date(this.formSave.value['ngayketthuc']));
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

  formatSQLDateTime(date: Date): string {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    const sec = '00';
    //'YYYY-MM-DD hh:mm:ss' type of sql DATETIME format
    return `${y}-${m}-${d}`;
  }

  strToTime(input: string): string {
    const date = input ? new Date(input) : null;
    let result = '';
    if (date) {
      result += [date.getDate().toString().padStart(2, '0'), (date.getMonth() + 1).toString().padStart(2, '0'), date.getFullYear().toString()].join('/');
      // result += ' ' + [date.getHours().toString().padStart(2, '0'), date.getMinutes().toString().padStart(2, '0')].join(':');
    }
    return result;
  }
}
