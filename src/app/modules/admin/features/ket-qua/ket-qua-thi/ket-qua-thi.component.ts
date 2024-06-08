import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ThptKetqua, ThptKetquaService} from "@shared/services/thpt-ketqua.service";
import {ThptKehoachThiService} from "@shared/services/thpt-kehoach-thi.service";
import {ThptHoiDong, ThptHoiDongService} from "@shared/services/thpt-hoi-dong.service";
import {ThptHoidongThisinhService} from "@shared/services/thpt-hoidong-thisinh.service";
import {NotificationService} from "@core/services/notification.service";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {Paginator} from "primeng/paginator";
import {NgPaginateEvent} from "@shared/models/ovic-models";
import * as XLSX from 'xlsx';
import {ThptHoiDongThiSinh} from "@shared/models/thpt-model";
import {HelperService} from "@core/services/helper.service";
import {BUTTON_NO, BUTTON_YES} from "@core/models/buttons";
import {debounceTime, Observable, of, Subject, Subscription, switchMap} from "rxjs";
import {DmPhongThi} from "@shared/services/danh-muc-phong-thi.service";

type AOA = any[][];

interface FileImport {
  id?: number;
  cathi: number;
  phongthi: number;
  monthi: string;
  thisinh_id: number;
  sobd: string;
  diem: string;
  hoten: string;
  ngaysinh: string;
  gioitinh: string;
  cccd_so: string;
  email: string;
  dienthoai: string;
  hoidong_id?: number;
  kehoach_id?: number;
  ngaythi?: string;
  created ?:boolean;
}

@Component({
  selector: 'app-ket-qua-thi',
  templateUrl: './ket-qua-thi.component.html',
  styleUrls: ['./ket-qua-thi.component.css']
})
export class KetQuaThiComponent implements OnInit {
  @ViewChild(Paginator) paginator: Paginator;

  typeTab: 1 | 0 = 0;// 0: danh sách kết qua thi 1:thao tác add file

  isLoading: boolean = false;

  recordsTotal: number = 0;

  listData: ThptKetqua[];
  rows = this.themeSettingsService.settings.rows;
  page: number = 1;

  subscription = new Subscription();

  private inputChanged: Subject<string> = new Subject<string>();

  textSearch:string = '';
  //============================================================
  errorFileType: boolean = false;
  loading: boolean = false;
  //============================================================
  dsHoidong: ThptHoiDong[];
  hoidongSelect: ThptHoiDong;

  dsThisinhInHoidong: ThptHoiDongThiSinh[] = [];

  //============================ sử lý file =======================
  file_name: string = '';
  datafile: FileImport[] = [];
  ketquaChange: 'have'|'nothave' = "have";
  ketquaImportView:FileImport[] = [];
  dsKetqua_have:FileImport[] = [];
  dsKetqua_nothave:FileImport[] = [];


  constructor(
    private thptKetquaService: ThptKetquaService,
    private thptHoiDongService: ThptHoiDongService,
    private thptHoidongThisinhService: ThptHoidongThisinhService,
    private notificationService: NotificationService,
    private themeSettingsService: ThemeSettingsService,
  ) {
  }

  ngOnInit(): void {
    this.inputChanged.pipe(debounceTime(1000)).subscribe((item: string) => {
      this.inputSearch(item);
    });
    this.loadInit()
  }


  loadInit() {
    this.notificationService.isProcessing(true);
    this.isLoading = true;
    this.thptHoiDongService.getDataUnlimitByStatus().subscribe({
      next: (data) => {
        this.dsHoidong = data;
        this.notificationService.isProcessing(false);
        this.isLoading = false;
        if (this.dsHoidong.length > 0) {
          this.loadData(1);

        }
      }, error: () => {
        this.isLoading = false;

        this.notificationService.isProcessing(false);
        this.notificationService.toastError('Load dữ liệu hội đồng không thành công ');
      }
    })

  }

  loadData(page: number) {
    this.notificationService.isProcessing(true);
    this.thptKetquaService.searchbytextAndHoidongId(page,this.textSearch.trim(), this.hoidongSiteKetqua_select).subscribe({
      next: ({recordsTotal, data}) => {
        this.recordsTotal = recordsTotal;
        this.listData = data.map((m,index)=>{
          m['__index_table'] = index + 1;
          return m
        })
        this.notificationService.isProcessing(false);

      }, error: () => {
        this.notificationService.isProcessing(false);

      }
    })
  }

  btnChangeType(type: 1 | 0) {
    this.typeTab = type;
    if (type === 1) {
      // this.loadDatahoidong();
      this.btnReset();
    } else {
      this.loadData(1);
    }
  }

  paginate({page}: NgPaginateEvent) {
    this.page = page + 1;
    this.loadData(this.page);
  }
  inputSearch(text:string){

    this.textSearch = text.trim();
    this.loadData(this.page);
  }

  onInputChange(event: string) {

    this.inputChanged.next(event);
  }

  onDroppedFiles(fileList: FileList) {
    const file: File = fileList.item(0);
    this.file_name = file.name;
    this.errorFileType = !(file && this.validateExcelFile(file));
    if (!this.errorFileType) {
      this.loading = true;

      const reader: FileReader = new FileReader();
      reader.onload = (e: any) => {
        /* read workbook */
        const wb: XLSX.WorkBook = XLSX.read(e.target.result, {type: 'binary'});

        /* grab first sheet */
        const firstSheetName: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[firstSheetName];



        /* save data */
        const rawData: AOA = <AOA>(XLSX.utils.sheet_to_json(ws, {header: 1}));
        const filterData = rawData.filter(u => !!(Array.isArray(u) && u.length));
        if (filterData.length) {
          // filterData.shift();
          filterData.shift();
          this.datafile = this.covertDataExport(filterData);

        }

      };
      reader.readAsBinaryString(file);
    } else {
      this.errorFileType = true;
      this.loading = false;
    }
  }

  inputFile() {
    const inputFile: HTMLInputElement = Object.assign(document.createElement('input'), {
      type: 'file',
      accept: '.xlsx',
      multiple: false,
      onchange: () => {
        this.onDroppedFiles(inputFile.files);

        setTimeout(() => inputFile.remove(), 1000)
      }
    });
    inputFile.click();
  }

  validateExcelFile(file: File): boolean {
    return file.name ? file.name.split('.').pop().toLowerCase() === 'xlsx' : false;
  }

  changeHoidong(event) {

    this.hoidongSelect = this.dsHoidong.find(f=>f.id === event.value);
    this.isLoading = true;
    this.notificationService.isProcessing(true);

    this.thptHoidongThisinhService.getDataByHoiDongIdNotPage(event.value).subscribe({
      next: (data) => {
        this.dsThisinhInHoidong = data;
        this.isLoading = false;
        this.notificationService.isProcessing(false);

      }, error: (e) => {
        this.isLoading = false;
        this.notificationService.isProcessing(false);
        this.notificationService.toastWarning('Load dữ liệu thí sinh trong hội đông không thành công ');

      }
    })
  }

  covertDataExport(datafile) {
    const data: FileImport[] = [];

    datafile.forEach(row => {
      const cell: FileImport = {
        cathi: row[0],
        phongthi: row[1],
        monthi: row[2],
        thisinh_id: row[3],
        sobd: row[4].toString(),
        diem: row[5].toFixed(1).toString(),
        hoten: row[6],
        ngaysinh: row[7],
        gioitinh: row[8],
        cccd_so: row[9],
        email: row[10],
        dienthoai: row[11],
        created:false
      }

      data.push(cell)
    })
    return data;


  }

  btnKiemtraDulieu(){
    this.notificationService.isProcessing(true);
    this.isLoading = true;

    if(this.datafile.length>0 && this.dsThisinhInHoidong.length>0){
      const dataReturn = this.kiemTraKetQua(this.datafile,this.dsThisinhInHoidong);
      this.dsKetqua_have = dataReturn[0];
      this.dsKetqua_nothave = dataReturn[1];
      this.ketquaImportView = this.dsKetqua_have;
      this.notificationService.isProcessing(false);
      this.isLoading = false;
    }else{
      this.isLoading = false;
      this.notificationService.isProcessing(false);
      this.notificationService.toastWarning('Vui lòng kiểm tra lại file upload hoặc hội đồng thi ');
    }
  }


  kiemTraKetQua(dsDataInFile: FileImport[], dsThisinhInHoidong: ThptHoiDongThiSinh[]): [ FileImport[],FileImport[] ] {
    let coGiaTri: FileImport[] = [];
    let khongGiaTri: FileImport[] = [];

    const dsThisinhInHoiDongByid = dsThisinhInHoidong.map(m=>m.thisinh_id)

    dsDataInFile.forEach(file=>{
      if (dsThisinhInHoiDongByid.includes(file.thisinh_id)){
        coGiaTri.push(file);
      }else{
        khongGiaTri.push(file);
      }
    })

    return [ coGiaTri, khongGiaTri ];
  }

  btnReset(){
    this.file_name = null;
    this.datafile = [];
    this.dsKetqua_have= [];
    this.dsKetqua_nothave= [];
    this.ketquaImportView= [];
    this.ketquaChange= "have";
  }
  btnKetquaChange(type:'have'|'nothave'){
    this.ketquaChange = type;
    if(type === 'have'){
      this.ketquaImportView = this.dsKetqua_have;
    }else{
      this.ketquaImportView = this.dsKetqua_nothave;

    }
  }

  async btnSubmitData(){
    const button = await this.notificationService.confirmRounded('Tải lên kết quả của thí sinh ', 'XÁC NHẬN', [BUTTON_NO, BUTTON_YES]);
    if (button.name === BUTTON_YES.name) {
      const step: number = 100 / this.dsKetqua_have.length;
      this.createThisinhControl(this.dsKetqua_have,this.hoidongSelect, step, 0).subscribe({
        next:()=>{
          this.notificationService.toastSuccess('Thao tác thành công');
          this.typeTab=0;
          this.btnReset();
          this.loadData(1);
        },error:()=>{
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Thao tác không thành công');
        }
      })

    }
  }
  private createThisinhControl(list: FileImport[],hoidongSelect:ThptHoiDong,step: number, percent: number): Observable<any> {
    const index: number = list.findIndex(i => !i.created);
    if (index !== -1) {
      return this.createTestRoom(list[index], hoidongSelect).pipe(switchMap(() => {
        list[index].created = true;
        const newPercent: number = percent + step;
        this.notificationService.loadingAnimationV2({process: {percent: newPercent}});
        return this.createThisinhControl(list,hoidongSelect, step, newPercent);
      }))
    } else {
      this.notificationService.disableLoadingAnimationV2();
      return of('complete');
    }
  }
  private createTestRoom(info: FileImport,hoidongSelect:ThptHoiDong): Observable<number> {

    const thisinh = {
      cathi: info.cathi,
      phongthi: info.phongthi,
      monthi: info.monthi,
      thisinh_id: info.thisinh_id,
      sobd: info.sobd,
      diem: info.diem,
      hoten: info.hoten,
      ngaysinh: info.ngaysinh,
      gioitinh: info.gioitinh,
      cccd_so: info.cccd_so,
      email: info.email,
      dienthoai: info.dienthoai,
      hoidong_id:hoidongSelect.id,
      kehoach_id:hoidongSelect.kehoach_id,
      ngaythi:hoidongSelect.ngaythi,
      status:1
    };
    return this.thptKetquaService.create(thisinh)
  }

  //==========================================================
  hoidongSiteKetqua_select :number = null;
  selectHoidongBySiteKetqua(event){
    this.hoidongSiteKetqua_select = event;
    this.loadData(1)
  }

  async btnDeleteByHoidong(){

    if(this.hoidongSiteKetqua_select){

      const hoidongselect = this.dsHoidong.find(f=>f.id = this.hoidongSiteKetqua_select)

      const button = await this.notificationService.confirmRounded('Xác nhận xóa kết quả thi của '+ hoidongselect.ten_hoidong ,'XÁC NHẬN', [BUTTON_YES, BUTTON_NO]);
      if (button.name === BUTTON_YES.name) {
        this.notificationService.isProcessing(true)
          this.thptKetquaService.getDataUnlimitByHoidongId(this.hoidongSiteKetqua_select).subscribe({
            next:(data)=>{

              const dataDelete = data.map(m=>{
                m['delete'] = false;
                return m;
              })
              if(dataDelete.length>0){
                const step: number = 100 / dataDelete.length;
                this.deleteItemKetquaInhoidong(dataDelete, step, 0).subscribe({
                  next:(m)=>{
                    this.loadData(1);
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastSuccess('Thao tác thành công');
                  },error:()=>{
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError('Thao tác không thành công');
                  }
                })
              }else{
                this.notificationService.toastError('Không tìm thấy kết quả thi trong hội đồng ')

              }

              this.notificationService.isProcessing(false);

            },error:()=>{
              this.notificationService.isProcessing(false);
              this.notificationService.toastError('Load kết quả không thành công ');

            }
          })
      }

    }else{
      this.hoidongSiteKetqua_select = null;
      this.notificationService.toastWarning('Vui lòng chọn hội đồng thi để thực hiện thao tác ');
    }
  }

  private deleteItemKetquaInhoidong(list: ThptKetqua[],step: number, percent: number): Observable<any> {
    const index: number = list.findIndex(i => !i['delete']);
    if (index !== -1) {
      return this.thptKetquaService.delete(list[index].id).pipe(switchMap(() => {
        list[index]['delete'] = true;
        const newPercent: number = percent + step;
        this.notificationService.loadingAnimationV2({process: {percent: newPercent}});
        return this.deleteItemKetquaInhoidong(list, step, newPercent);
      }))
    } else {
      this.notificationService.disableLoadingAnimationV2();
      return of('complete');
    }
  }
  async deleteItemInKetqua(item:ThptKetqua){
    const confirm = await this.notificationService.confirmDelete();
    if (confirm) {
      this.thptKetquaService.delete(item.id).subscribe({
        next: () => {

          this.notificationService.isProcessing(false);
          this.notificationService.toastSuccess('Thao tác thành công');
          this.listData = this.listData.filter(f=>f.id !== item.id);

        }, error: () => {
          this.notificationService.isProcessing(false);
          this.notificationService.toastError('Thao tác không thành công');
        }
      })
    }
  }



}


