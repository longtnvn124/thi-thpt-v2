import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import {AbstractControl} from "@angular/forms";
import {OvicFile} from "@core/models/file";
import {FileService} from "@core/services/file.service";
import {NotificationService} from "@core/services/notification.service";
import {AvatarMakerSetting, MediaService} from "@shared/services/media.service";
import {map} from "rxjs/operators";
import {TYPE_FILE_IMAGE} from "@shared/utils/syscat";

@Component({
  selector: 'ovic-avata-type-thpt',
  templateUrl: './ovic-avata-type-thpt.component.html',
  styleUrls: ['./ovic-avata-type-thpt.component.css']
})
export class OvicAvataTypeThptComponent implements OnInit {
  @Input() disabled:boolean = false;
  @Input() formField: AbstractControl;
  @Input() multiple = true;
  @Input() accept = []; // only file extension eg. .jpg, .png, .jpeg, .gif, .pdf
  @Input() aspectRatio:number;// 3 / 2, 2 / 3
  @Input() textView:string='Upload file';
  @Input() height:string;//300px;
  characterAvatar: string = '';
  fileList:OvicFile[]=[];
  _accept = '';
  constructor(
    private fileService: FileService,
    private notificationService: NotificationService,
    private mediaService: MediaService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['accept']) {
      if (this.accept && this.accept.length) {
        this._accept = this.accept.join(',');
      }
    }
  }

  ngOnInit(): void {
    if (this.formField) {
      this.formField.valueChanges.pipe(map(t => (t && Array.isArray(t)) ? t : [])).subscribe((files: OvicFile[]) => {
        this.fileList = files.filter(Boolean).map(file => {
          file['link_img'] = file ? this.fileService.getPreviewLinkLocalFile(file): '';
          return file;
        });
        this.characterAvatar = this.fileList[0]? this.fileList[0]['link_img'] :'';
      });
      if (this.formField.value && Array.isArray(this.formField.value)) {
        this.fileList = this.formField.value.filter(Boolean).map(file => {
          file['link_img'] = file ? this.fileService.getPreviewLinkLocalFile(file): '';
          return file;
        });
        this.characterAvatar = this.fileList[0]? this.fileList[0]['link_img'] :'';
      }

    }
    if (this.accept && this.accept.length) {
      this._accept = this.accept.join(',');
    }
  }

  async makeCharacterAvatar(file: File, characterName: string): Promise<File> {
    try {
      const options: AvatarMakerSetting = {
        aspectRatio: this.aspectRatio ? this.aspectRatio : 2 / 3,
        resizeToWidth: 300,
        format: 'jpeg',
        cropperMinWidth: 10,
        dirRectImage: {
          enable: true,
          dataUrl: URL.createObjectURL(file)
        }
      };
      const avatar = await this.mediaService.callAvatarMaker(options);
      if (avatar && !avatar.error && avatar.data) {
        const none = new Date().valueOf();
        const fileName = characterName + none + '.jpg';
        return Promise.resolve(this.fileService.base64ToFile(avatar.data.base64, fileName));
      } else {
        return Promise.resolve(null);
      }
    } catch (e) {
      this.notificationService.isProcessing(false);
      this.notificationService.toastError('Quá trình tạo avatar thất bại');
      return Promise.resolve(null);
    }
  }

  typeFileAdd = TYPE_FILE_IMAGE;
  async onInputAvatar(event, fileChooser: HTMLInputElement,index:number) {

    if (fileChooser.files && fileChooser.files.length) {
      if (this.typeFileAdd.includes(fileChooser.files[0].type)){
        const file = await this.makeCharacterAvatar(fileChooser.files[0], fileChooser.files[0].name);
        // upload file to server
        this.fileService.uploadFile(file, 1).subscribe({
          next: fileUl => {
            // this.objectThumbnail = this.objectThumbnail.length>0 ? [].concat(fileUl);

            if (this.fileList[index]){
              this.fileList[index] = fileUl;
              this.formField.setValue(this.fileList)
            }else{
              this.fileList = this.fileList.concat(fileUl);
              this.formField.setValue(this.fileList)
            }
          }, error: () => {
            this.notificationService.toastError('Upload file không thành công');
          }
        })
      }else{
        this.notificationService.toastWarning("Định dạng file không phù hợp");
      }
    }
  }

}
