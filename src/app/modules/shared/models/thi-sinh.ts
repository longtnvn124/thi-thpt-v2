import {OvicFile} from "@core/models/file";
import {
  InputDiaDanh
} from "@shared/components/ovic-input-address-four-layouts/ovic-input-address-four-layouts.component";

export interface ThiSinhInfo {
  id ?: number;
  user_id:number;
  hoten:string;
  ten:string;
  ngaysinh:string;
  gioitinh:string;
  dantoc:string;
  tongiao:string;
  noisinh:string;
  noisinhkhac:string;
  quequan:InputDiaDanh;
  phone:string;
  anh_chandung:OvicFile;
  cccd_so:number;
  cccd_ngaycap:string;
  cccd_noicap:string;
  cccd_img_truoc:OvicFile;
  cccd_img_sau:OvicFile,
  thuongtru_diachi:InputDiaDanh;
  nguoinhan_hoten:string;
  nguoinhan_phone:number;
  nguoinhan_diachi:InputDiaDanh;
  khuvuc:number;// id khu vuc
  namtotnghiep_thpt:string;
  lop10_thanhpho:string;
  lop11_thanhpho:string;
  lop12_thanhpho:string;
  lop10_truong:string;
  lop11_truong:string;
  lop12_truong:string;
  diem10ky1:string;
  diem10ky2:string;
  diem11ky1:string;
  diem11ky2:string;
  diem12ky1:string;
  diem12ky2:string;
  status :0|1;// khoá
}
