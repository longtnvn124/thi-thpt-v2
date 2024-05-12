

export interface ThptHoiDongPhongThi {
  id?: number;
  kehoach_id: number;
  hoidong_id: number;
  ten_phongthi: string;
  mota: string;
  sothisinh: number;
  canbo_coithi: string;
  status: 1 | 0;
  thisinh_ids: number[];
  monthi_ids: number[];
  ma_phongthi: string;
}

export interface ThptHoiDongThiSinh {
  id?: number;
  hoidong_id: number;
  thisinh_id: number;
  monthi_ids?: number[];
}
