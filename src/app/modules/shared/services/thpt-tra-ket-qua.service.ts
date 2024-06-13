import {Injectable} from '@angular/core';
import {getRoute} from "@env";
import {HttpClient, HttpParams} from "@angular/common/http";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {AuthService} from "@core/services/auth.service";
import {map, Observable} from "rxjs";
import {Dto, OvicConditionParam, OvicQueryCondition} from "@core/models/dto";

export interface DotDangKy {
  kehoach_id: number;
  monthi: string[];
}

export interface ThptTraKetQua {
  id?: number;
  ten_phieu: string;
  trangthai_thanhtoan: number;
  accept: number;
  dotdangky: DotDangKy[];
  mota: string;
  thisinh_id: string;
  hoten: string;
  ngaysinh: string;
  cccd_so: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThptTraKetQuaService {

  private readonly api = getRoute('thpt-traketqua/');

  constructor(
    private http: HttpClient,
    private httpParamsHelper: HttpParamsHeplerService,
    private themeSettingsService: ThemeSettingsService,
    private auth: AuthService
  ) {
  }

  load(page: number, search?: string): Observable<{ recordsTotal: number, data: ThptTraKetQua[] }> {
    const conditions: OvicConditionParam[] = [];
    if (search) {
      conditions.push({
          conditionName: 'hoten',
          condition: OvicQueryCondition.like,
          value: `%${search}%`,
          orWhere: "or"
        },
        {
          conditionName: 'id',
          condition: OvicQueryCondition.like,
          value: `%${search}%`,
          orWhere: "or"
        },
        {
          conditionName: 'cccd_so',
          condition: OvicQueryCondition.like,
          value: `%${search}%`,
          orWhere: "or"
        }
      )
    }
    const fromObject = {
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'id',
      order: "ASC"
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({fromObject}));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => ({
      recordsTotal: res.recordsFiltered,
      data: res.data
    })))
  }

  create(data: any): Observable<number> {
    return this.http.post<Dto>(this.api, data).pipe(map(res => res.data));
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put<Dto>(''.concat(this.api, id.toString(10)), data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(''.concat(this.api, id.toString(10)));
  }


  getdatabythisinhId(page: number, thisinh_id:number): Observable<{ recordsTotal: number, data: ThptTraKetQua[] }> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'thisinh_id',
        condition: OvicQueryCondition.equal,
        value: thisinh_id.toString(),
      }
    ];

    const fromObject = {
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'id',
      order: "ASC"
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({fromObject}));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => ({
      recordsTotal: res.recordsFiltered,
      data: res.data
    })))
  }

}
