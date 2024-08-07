import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {User} from "@core/models/user";
import {debounceTime, firstValueFrom, Observable, of, Subject, Subscription, switchMap} from "rxjs";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {FileService} from "@core/services/file.service";
import {AuthService} from "@core/services/auth.service";
import {NotificationService} from "@core/services/notification.service";
import {UserService} from "@core/services/user.service";
import {AvatarMakerSetting, MediaService} from "@shared/services/media.service";
import {distinctUntilChanged, filter, map} from "rxjs/operators";
import {OvicButton} from "@core/models/buttons";
import {APP_CONFIGS, getLinkDrive} from "@env";

@Component({
  selector: 'app-thi-sinh-tai-khoan',
  templateUrl: './thi-sinh-tai-khoan.component.html',
  styleUrls: ['./thi-sinh-tai-khoan.component.css']
})
export class ThiSinhTaiKhoanComponent implements OnInit, OnChanges {

  @Input() userId: number;
  @ViewChild('fileChooser') fileChooser: ElementRef<HTMLInputElement>;

  user: User;

  avatar = '../../../../assets/images/a_none.jpg';

  subscriptions = new Subscription();

  translations = {
    title: 'Thông tin tài khoản',
    subtitle: 'Cập nhật thông tin tài khoản',
    errorAvatarType: 'Chỉ chấp nhận các file có định dạng .png, .jpg, .jpeg',
    errorAvatarSize: 'Kích thước tệp hình ảnh không được lớn hơn 15Mb',
    lblCreateStorageSpaceHead: 'Khởi tạo không gian lưu trữ',
    lblCreateStorageSpaceMessage: 'Vui lòng khởi tạo không gian lưu trữ của bạn',
    lblCreateStorageSpaceMessageBeforeUsing: 'Vui lòng khởi tạo không gian lưu trữ trước khi lưu trũ dữ liệu',
    lblCreateNow: 'Khởi tạo',
    lblRemindLate: 'Để sau',
    headCreateStoreFail: 'Lỗi',
    messageCreateStoreFail: 'Quá trình khởi tạo không gian lưu trữ thất bại',
    headCreateStoreSuccess: 'Thành công',
    messageCreateStoreSuccess: 'Đã khởi tạo không gian lưu trữ thành công',
    messageUpdateAvatarSuccess: 'Cập nhật avatar thành công',
    messageUpdateAvatarFail: 'Cập nhật avatar thất bại',
    headUpdateUserSuccess: 'Cập nhật thông tin thành công',
    headUpdateUserFail: 'Cập nhật thông tin thất bại'
  };

  isUpdatePassword = false;

  timeOut: any;

  form: FormGroup;

  errorList = {
    userNameAlreadyExist: false
  };

  emailControl = {
    error: false,
    checking: false,
    alreadyExist: false
  };

  phoneControl = {
    error: false,
    checking: false,
    alreadyExist: false
  };

  buttons = {
    submit: {
      icon: 'pi pi-check',
      label: 'Cập nhật',
      class: 'p-button p-button--fade p-disabled',
      isLoading: false
    },
    refresh: {
      icon: 'pi pi-refresh',
      label: 'Làm mới',
      class: 'p-button p-button-success',
      isLoading: false
    }
  };



  submitEvent$ = new Subject<any>();

  refreshEvent$ = new Subject<any>();

  dataChanged = false;

  avatarUploading = false;

  constructor(
    private fileService: FileService,
    private auth: AuthService,
    private notificationService: NotificationService,
    private userService: UserService,
    private fb: FormBuilder,
    private mediaService: MediaService
  ) {
    this.form = this.fb.group({
      display_name: ['', [Validators.required, Validators.minLength(3)]],
      username: [{ value: '', disabled: false }],
      phone: [null, [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      email: [{ value: '', disabled: false }, [Validators.required, Validators.pattern(/^[a-zA-Z0-9_\.]+@[a-zA-Z_]+?\.[a-zA-Z]{2,4}$/)]],
      password: [{ value: '*********', disabled: true }, [Validators.required, Validators.minLength(8), Validators.pattern('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$')]],
      verified:[0],
    });
    const observerUpdateUser = this.auth.onSetUpUser().subscribe({ next: (user) => this.avatar = user.avatar });
    const observerTranslate = this.auth.appLanguageSettings().pipe(filter(v => v !== null && v !== undefined), map(res => res && res.translations ? res.translations.thongTinTaiKhoan : null)).subscribe({
      next: (translations: any) => this.translations = translations
    });
    const observerChangeEmail = this.form.get('email').valueChanges.pipe(
      debounceTime(400),
      switchMap(newEmail => this.checkEmailValid(newEmail))
    ).subscribe({
      next: valid => {
        this.emailControl.error = false;
        if (!valid) {
          this.f['email'].setErrors({ incorrect: true });
          this.f['email'].markAllAsTouched();
        }
        this.checkSubmitButtonVisible();
      },
      error: () => {
        this.emailControl.error = true;
        this.emailControl.checking = false;
        this.emailControl.alreadyExist = false;
        this.f['email'].setErrors({ incorrect: true });
        this.f['email'].markAllAsTouched();
      }
    });
    const observerChangePhone = this.form.get('phone').valueChanges.pipe(
      debounceTime(400),
      switchMap(newPhoneNumber => this.checkNewPhoneIsValid(newPhoneNumber))
    ).subscribe({
      next: valid => {
        this.phoneControl.error = false;
        if (!valid) {
          this.f['phone'].setErrors({ incorrect: true });
          this.f['phone'].markAllAsTouched();
        }
        this.checkSubmitButtonVisible();
      },
      error: () => {
        this.phoneControl.error = true;
        this.phoneControl.checking = false;
        this.phoneControl.alreadyExist = false;
        this.f['phone'].setErrors({ incorrect: true });
        this.f['phone'].markAllAsTouched();
      }
    });
    const observerSubmitProcess = this.submitEvent$.pipe(debounceTime(100)).subscribe({ next: () => this.handleSubmitEvent() });
    const observerRefreshForm = this.refreshEvent$.pipe(debounceTime(100)).subscribe({ next: () => this.handleRefreshEvent() });
    const checkFormInvalid = this.form.valueChanges.pipe(debounceTime(50), distinctUntilChanged(), map(() => this.form.valid)).subscribe({
      next: () => {
        this.dataChanged = true;
        this.checkSubmitButtonVisible();
      }
    });
    this.subscriptions.add(observerUpdateUser);
    this.subscriptions.add(observerTranslate);
    this.subscriptions.add(observerChangeEmail);
    this.subscriptions.add(observerChangePhone);
    this.subscriptions.add(observerRefreshForm);
    this.subscriptions.add(observerSubmitProcess);
    this.subscriptions.add(checkFormInvalid);
  }

  ngOnChanges(changes: SimpleChanges): void {

    if(this.userId){
      this.loadUser(this.userId);
    }
  }

  ngOnInit(): void {
    // this.user = this.auth.user;

    // if(this.userId){
    //   this.loadUser(this.userId);
    // }
  }

  get f() {
    return this.form.controls;
  }

  loadUser(id:number){
    this.notificationService.isProcessing(true);
    this.userService.getUser(id, 'username,email,phone,display_name,verified').subscribe({
      next:(data)=>{
        this.user =  data;
        this.form.reset({
          display_name: data.display_name,
          username: data.username,
          phone: data.phone,
          email: data.email,
          password: '*********',
          verified: data['verified'] === 1 ? true : false,
        })
        this.notificationService.isProcessing(false);


      },
      error:()=>{
        this.notificationService.isProcessing(false);

      }
    })
  }

  async changeAvatar() {
    this.fileChooser.nativeElement.click();
  }

  async onFileInput(fileList: FileList, fileChooser: HTMLInputElement) {
    if (fileList.length) {
      const file = fileList[0];
      if (!(file.name && (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')))) {
        this.notificationService.toastWarning(this.translations.errorAvatarType);
        return;
      }

      if (file.size > (1024 * 1024 * 15)) {
        this.notificationService.toastWarning(this.translations.errorAvatarSize);
        return;
      }
      try {
        const options: AvatarMakerSetting = {
          aspectRatio: 1,
          resizeToWidth: 120,
          dirRectImage: {
            enable: true,
            dataUrl: URL.createObjectURL(file)
          }
        };
        const avatar = await this.mediaService.callAvatarMaker(options);
        if (avatar && !avatar.error && avatar.data) {
          const none = new Date().valueOf();
          const fileName = this.user.username + none + '.png';
          const file = this.fileService.base64ToFile(avatar.data.base64, fileName);
          this.__startUploadAvatar(file);
          // this.notificationService.isProcessing( true );
          // const uploadAvatar$ = this.fileService.googleDriveUploadFileToParents( file , this.auth.cloudStore );
          // const fileRes       = await firstValueFrom( uploadAvatar$ );
          // this.updateAvatars( fileRes[ 0 ].id );
        }
      } catch (e) {
        console.error(e);
        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Quá trình tạo avatar thất bại');
      }
      // if ( this.fileService.formatBytes( file.size ) > (1024 * 1024 * 15) ) {}
    }

    if (fileChooser) {
      fileChooser.value = '';
    }
  }

  private __startUploadAvatar(file: File) {
    this.avatarUploading = true;
    this.fileService.uploadAvatar(file).subscribe({
      next: src => {
        const newUser = JSON.parse(JSON.stringify(this.user));
        newUser.avatar = src;
        this.auth.updateUser(newUser);
        this.avatarUploading = false;
      },
      error: error => {

        this.avatarUploading = false;
      }
    });
  }

  updateAvatars(fileId: string) {
    const data = {
      username: this.auth.user.username,
      avatar: getLinkDrive(fileId + '/download')
    };
    const id = this.auth.user.id;
    this.notificationService.isProcessing(true);
    this.userService.updateUserInfo(id, data).pipe(switchMap(() => this.userService.getUser(this.auth.user.id))).subscribe({
      next: (user) => {
        this.auth.updateUser(user);
        this.notificationService.isProcessing(false);
        void this.notificationService.alertSuccess(this.translations.headCreateStoreSuccess, this.translations.messageUpdateAvatarSuccess);
      },
      error: () => {
        void this.notificationService.alertError(this.translations.headCreateStoreFail, this.translations.messageUpdateAvatarFail);
        this.notificationService.isProcessing(false);
      }
    });
  }

  changeUpdatePasswordMode() {
    this.isUpdatePassword = !this.isUpdatePassword;
    if (this.timeOut) {
      clearTimeout(this.timeOut);
    }
    this.timeOut = setTimeout(() => {
      if (this.isUpdatePassword) {
        this.f['password'].enable({ emitEvent: true });
        this.f['password'].setValue('');
        this.f['password'].markAsUntouched();
      } else {
        this.f['password'].disable({ emitEvent: false });
        this.f['password'].setValue('*********');
      }
    }, 50);
  }

  checkEmailValid(newEmail: string): Observable<boolean> {
    this.emailControl.error = false;
    if (this.form.get('email').valid) {
      this.emailControl.checking = true;
      return this.userService.validateUserEmail(newEmail, this.user.email).pipe(map(isValid => {
        this.emailControl.checking = false;
        this.emailControl.alreadyExist = !isValid;
        return isValid;
      }));
    } else {
      this.emailControl.checking = false;
      this.emailControl.alreadyExist = false;
      return of(false);
    }
  }

  checkNewPhoneIsValid(newPhoneNumber: string): Observable<boolean> {
    this.phoneControl.error = false;
    if (this.form.get('phone').valid) {
      this.phoneControl.checking = true;
      return this.userService.validateUserPhone(newPhoneNumber, this.user.phone).pipe(map(isValid => {
        this.phoneControl.checking = false;
        this.phoneControl.alreadyExist = !isValid;
        return isValid;
      }));
    } else {
      this.phoneControl.checking = false;
      this.phoneControl.alreadyExist = false;
      return of(false);
    }
  }


  handleSubmitEvent() {
    if (this.form.valid) {
      this.notificationService.isProcessing(true);
      const check = this.f['verified'].value  ? 1:0;
      this.f['verified'].setValue(check);

        const data = { ... this.form.value };
      this.userService.updateUserInfo(this.userId, data).pipe(switchMap(() => this.userService.getUser(this.userId))).subscribe({
        next: (user) => {
          this.user = user;
          this.loadUser(this.userId);
          this.notificationService.isProcessing(false);
          void this.notificationService.toastSuccess(this.translations.headUpdateUserSuccess);
          this.buttons.submit.icon = 'pi pi-check';
          this.buttons.submit.isLoading = false;
          this.handleRefreshEvent();
        },
        error: () => {
          this.notificationService.isProcessing(false);
          void this.notificationService.toastError(this.translations.headUpdateUserFail);
          this.buttons.submit.icon = 'pi pi-check';
          this.buttons.submit.isLoading = false;
          this.handleRefreshEvent();
        }
      });
    } else {
      this.buttons.submit.icon = 'pi pi-check';
      this.buttons.submit.isLoading = false;
    }
  }

  btnSubmitClick() {
    if (!this.buttons.submit.isLoading) {
      this.buttons.submit.icon = 'pi pi-spin pi-spinner';
      this.buttons.submit.isLoading = true;
      this.submitEvent$.next('');
    }
  }

  btnRefreshClick() {
    if (!this.buttons.refresh.isLoading && this.form.valid && this.dataChanged) {
      this.buttons.refresh.icon = 'pi pi-spin pi-spinner';
      this.buttons.refresh.isLoading = true;
      this.refreshEvent$.next('');
    }
  }

  handleRefreshEvent() {
    const options = { onlySelf: true, emitEvent: false };
    this.form.reset({
      display_name: this.user.display_name,
      username: this.user.username,
      phone: this.user.phone,
      email: this.user.email,
      password: '*********'
    }, options);
    this.form.get('password').disable({ emitEvent: false });
    this.form.get('password').setValue('*********');
    this.form.markAsUntouched();
    this.buttons.refresh.icon = 'pi pi-refresh';
    this.buttons.refresh.isLoading = false;
    this.dataChanged = false;
    this.buttons.submit.class = 'p-button p-button--fade p-disabled';
    this.checkSubmitButtonVisible();
  }

  checkSubmitButtonVisible() {
    const ready = this.dataChanged && this.form.valid && !this.emailControl.checking && !this.phoneControl.checking;
    this.buttons.submit.class = ready ? 'p-button p-button-primary' : 'p-button p-button--fade p-disabled';
  }
}
