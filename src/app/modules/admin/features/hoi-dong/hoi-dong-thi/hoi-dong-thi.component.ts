
import { NotificationService } from '@core/services/notification.service';
import { ThptKehoachThiService, KeHoachThi } from './../../../../shared/services/thpt-kehoach-thi.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ThptHoiDong, ThptHoiDongService } from '@modules/shared/services/thpt-hoi-dong.service';
import { FormType, OvicForm } from '@modules/shared/models/ovic-models';
import { Observable, Subject, Subscription, debounceTime, filter } from 'rxjs';
import { ThptHoiDongPhongThi } from "@shared/models/thpt-model";


interface FormHoiDong extends OvicForm {
  object: ThptHoiDong;
}

@Component({
  selector: 'app-hoi-dong-thi',
  templateUrl: './hoi-dong-thi.component.html',
  styleUrls: ['./hoi-dong-thi.component.css']
})
export class HoiDongThiComponent implements OnInit {
  @ViewChild('fromUpdate', { static: true }) template: TemplateRef<any>;
  @ViewChild('examinationRoom', { static: true }) examinationRoom: TemplateRef<any>;
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
  listForm = {
    [FormType.ADDITION]: { type: FormType.ADDITION, title: 'Thêm mới hội đồng', object: null, data: null },
    [FormType.UPDATE]: { type: FormType.UPDATE, title: 'Cập nhật hội đồng', object: null, data: null }
  };
  formActive: FormHoiDong;
  formSave: FormGroup;

  isLoading: boolean = true;
  loadInitFail: boolean = false;
  dataKeHoach: KeHoachThi[];


  subscription = new Subscription();
  sizeFullWidth = 1024;
  needUpdate = false;
  menuName: 'hoi-dong';
  btn_checkAdd: 'Lưu lại' | 'Cập nhật';
  _kehoach_id: number;

  onResizeMap: Subject<string> = new Subject<string>();
  private OBSERVE_PROCESS_FORM_DATA = new Subject<FormHoiDong>();


  listData: ThptHoiDong[];

  kehoach_id_param:number;
  constructor(
    private kehoachThiService: ThptKehoachThiService,
    private hoiDongService: ThptHoiDongService,
    private notifi: NotificationService,
    private fb: FormBuilder,
  ) {
    const observeProcessFormData = this.OBSERVE_PROCESS_FORM_DATA.asObservable().pipe(debounceTime(100)).subscribe(form => this.__processFrom(form));
    this.subscription.add(observeProcessFormData);
    const observeProcessCloseForm = this.notifi.onSideNavigationMenuClosed().pipe(filter(menuName => menuName === this.menuName && this.needUpdate)).subscribe(() => this.loadData());
    this.subscription.add(observeProcessCloseForm);
    const observerOnResize = this.notifi.observeScreenSize.subscribe(size => this.sizeFullWidth = size.width)
    this.subscription.add(observerOnResize);

    this.formSave = this.fb.group({
      kehoach_id: [null, Validators.required],
      ten_hoidong: [null, Validators.required],
      mota: [null,],
      status: [1, Validators.required],
    })
  }

  ngOnInit(): void {
    this.loadInit()
  }

  loadInit() {
    this.loadData();
  }

  loadData() {
    this.getDataKeHoach();
  }

  getDataKeHoach() {
    this.notifi.isProcessing(true)
    this.isLoading = true;
    this.kehoachThiService.getDataUnlimit().subscribe({
      next: (data) => {
        this.dataKeHoach = data;
        this.getDataHoiDong();
        this.notifi.isProcessing(false);
        this.isLoading = false;
      }, error: (e) => {
        this.notifi.isProcessing(false);
        this.isLoading = false;
        this.notifi.toastError('Mất kết nối với máy chủ');
      }
    })
  }
  changeSelectData(event) {

    this._kehoach_id = event;
    this.getDataHoiDong(event);

  }
  changeInputText(event) {
    console.log(event);

  }

  getDataHoiDong(kehoach_id?: number, search?: string) {
    this.isLoading = true;
    this.notifi.isProcessing(true);
    this.hoiDongService.loadDataUnlimit(kehoach_id).subscribe({
      next: (data) => {
        let i = 1;
        this.listData = data.map(m => {

          m['__indexTable'] = i++;
          m['__kehoach_coverted'] = this.dataKeHoach.find(f => f.id = m.id) ? this.dataKeHoach.find(f => f.id = m.id).dotthi : '';
          const sIndex = this.statusList.findIndex(i => i.value === m.status);
          m['__status_converted'] = sIndex !== -1 ? this.statusList[sIndex].color : '';
          return m;
        })

        this.isLoading = false;
        this.notifi.isProcessing(false);
      },
      error: (e) => {
        this.isLoading = false;
        this.notifi.isProcessing(false);
      }
    })
  }

  private __processFrom({ data, object, type }: FormHoiDong) {
    this.isLoading = true;
    const observer$: Observable<any> = type === FormType.ADDITION ? this.hoiDongService.create(data) : this.hoiDongService.update(object.id, data);
    observer$.subscribe({
      next: () => {
        this.needUpdate = true;
        if (type === FormType.ADDITION) {
          this.formSave.reset({
            Kehoach_id: null,
            ten_hoidong: '',
            mota: '',
            status: 1
          });
        }
        this.getDataHoiDong(this._kehoach_id);
        this.isLoading = false;
        this.notifi.toastSuccess('Thao tác thành công', 'Thông báo');
      },
      error: () => {
        this.isLoading = false;
        this.notifi.toastError('Thao tác thất bại', 'Thông báo');
      }
    });
  }

  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }

  changeInput(text) {

  }

  btnAddNew(type: 'add' | 'update', item?: ThptHoiDong) {
    if (type === 'add') {
      this.btn_checkAdd = "Lưu lại";
      this.formSave.reset({
        Kehoach_id: null,
        ten_hoidong: '',
        mota: '',
        status: 1
      });
      // this.characterAvatar = ''
      this.formActive = this.listForm[FormType.ADDITION];
      this.preSetupForm(this.menuName);
    }
    else if (type === 'update') {
      this.btn_checkAdd = "Cập nhật"
      const object1 = this.listData.find(u => u.id === item.id);
      this.formSave.reset({
        Kehoach_id: object1.kehoach_id,
        ten_hoidong: object1.ten_hoidong,
        mota: object1.mota,
        status: object1.status
      });
      this.formActive = this.listForm[FormType.UPDATE];
      this.formActive.object = object1;
      this.preSetupForm(this.menuName);
    }
  }

  private preSetupForm(name: string) {
    this.notifi.isProcessing(false);
    this.notifi.openSideNavigationMenu({
      name: name,
      template: this.template,
      size: 1024,
      offsetTop: '0px'
    });
  }

  closeForm() {
    this.loadInit();
    this.notifi.closeSideNavigationMenu(this.menuName);
  }

  saveForm() {
    const titleInput = this.f['ten_hoidong'].value.trim();
    this.f['ten_hoidong'].setValue(titleInput);
    if (this.formSave.valid) {
      if (titleInput !== '') {
        this.formActive.data = this.formSave.value;
        this.OBSERVE_PROCESS_FORM_DATA.next(this.formActive);
      } else {
        this.notifi.toastWarning('Vui lòng không nhập khoảng trống');
      }
    } else {
      this.formSave.markAllAsTouched();
      this.notifi.toastWarning('Vui lòng nhập đủ thông tin');
    }
  }

  async btnDelete(item: ThptHoiDong) {
    const confirm = await this.notifi.confirmDelete();
    if (confirm) {
      this.hoiDongService.delete(item.id).subscribe({
        next: () => {
          // this.page = Math.max(1, this.page - (this.listData.length > 1 ? 0 : 1));
          this.notifi.isProcessing(false);
          this.notifi.toastSuccess('Thao tác thành công');
          this.getDataHoiDong(this._kehoach_id);

        }, error: () => {
          this.notifi.isProcessing(false);
          this.notifi.toastError('Thao tác không thành công');
        }
      })
    }
  }

  hoidong_id: number;

  btnViewPhongThi(item: ThptHoiDong) {
    this.notifi.isProcessing(false);
    this.notifi.openSideNavigationMenu({
      template: this.examinationRoom,
      size: this.sizeFullWidth,
      offsetTop: '0px'
    });

    this.hoidong_id = item.id;
    this.kehoach_id_param= item.kehoach_id;
  }


  dataTest = [
    { id: 1, ten: "Anh" },
    { id: 2, ten: "Bá" },
    { id: 3, ten: "Anh" },
    { id: 4, ten: "Tú" },
    { id: 5, ten: "Anh" },
    { id: 6, ten: "Phượng" },
    { id: 7, ten: "Anh" },
    { id: 8, ten: "Anh" },
    { id: 9, ten: "Hồng" },
    { id: 10, ten: "Anh" },
    { id: 11, ten: "Anh" },
    { id: 12, ten: "Hoàng" },
    { id: 13, ten: "Anh" },
    { id: 14, ten: "Anh" },
    { id: 15, ten: "Uyên" },
    { id: 16, ten: "Anh" },
    { id: 17, ten: "Anh" },
    { id: 18, ten: "Anh" },
    { id: 19, ten: "Tú" },
    { id: 20, ten: "Anh" },
    { id: 21, ten: "Anh" },
    { id: 22, ten: "Minh" },
    { id: 23, ten: "Anh" },
    { id: 24, ten: "Long" },
    { id: 25, ten: "Anh" },
  ]
  btnCreateRoom() {
    // const user = 17;
    // const userinRoom = 3;
    // let room: number;
    // console.log((user - (user % userinRoom)) / userinRoom, user % userinRoom);
    // console.log(room);

    // if (user <= userinRoom) {
    //   room = 1;
    // } else {
    //   room = user % userinRoom === 0 ? (user / userinRoom) : (Math.floor(user / userinRoom) + 1);
    // }
    // console.log(room);
    // let rooms: ThptHoiDongPhongThi[] = []
    // for (let i = 1; i <= room; i++) {
    //   const roomAdd: ThptHoiDongPhongThi = {
    //     kehoach_id: this._kehoach_id,
    //     hoidong_id: this.hoidong_id,
    //     ten_phong_thi: 'Phòng thi môn ' + this.hoidong_id + '-' + i,
    //     mota: '',
    //     sothisinh: userinRoom,
    //     canbo_coithi: '',
    //     status: 1
    //   };
    //   rooms.push(roomAdd);
    // }
    // console.log(rooms);

    const thisinh = [
      { id: 1, ten: "Anh" },
      { id: 2, ten: "Anh" },
      { id: 3, ten: "Anh" },
      { id: 4, ten: "Long" },
      { id: 5, ten: "Tú" },
      { id: 6, ten: "Phượng" },
      { id: 7, ten: "Phượng" }
    ];

    const Phongthi = [
      { id: 1, thisinh_id: [] },
      { id: 2, thisinh_id: [] },
      { id: 3, thisinh_id: [] }
    ];
    let thisinhIndex = 0;
    for (let i = 0; i < thisinh.length; i++) {
      console.log(i % Phongthi.length);

      Phongthi[i % Phongthi.length].thisinh_id.push(thisinh[i].id);
    }
    console.log(Phongthi);

  }

}
