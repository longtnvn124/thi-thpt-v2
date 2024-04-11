

export interface ThptHoiDongPhongThi{
  id?: number;
  kehoach_id:number;
  hoidong_id:number;
  ten_phong_thi:string;
  mota:string;
  sothisinh:number;
  canbo_coithi:string;
  status:1|0;
}

export interface ThptHoiDongThiSinh{
  id?: number;
  hoidong_id:number;
  thisinh_id:number;
  phongthi_id:string;
  monthi_id:string;
  sothisinh:number;

}
