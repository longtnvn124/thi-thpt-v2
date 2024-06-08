import {Injectable} from '@angular/core';
import {getRoute} from "@env";
import {HttpClient, HttpParams} from "@angular/common/http";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {map, Observable} from "rxjs";
import {Dto, OvicConditionParam, OvicQueryCondition} from "@core/models/dto";
import {KeHoachThi} from "@shared/services/thpt-kehoach-thi.service";

export interface ThptKetqua {
  id?: number;
  cathi: number;
  hoidong_id: number;
  kehoach_id: number;
  ngaythi: string;
  phongthi: number;
  monthi: string;
  sobd: string;
  diem: number;
  hoten: string;
  ngaysinh: string;
  gioitinh: string;
  cccd_so: number;
  email: string;
  dienthoai: number;

}

@Injectable({
  providedIn: 'root'
})
export class ThptKetquaService {
  private readonly api = getRoute('thpt-ketqua/');

  constructor(
    private http: HttpClient,
    private httpParamsHelper: HttpParamsHeplerService,
    private themeSettingsService: ThemeSettingsService
  ) {

  }

  load(page: number): Observable<{ recordsTotal: number, data: ThptKetqua[] }> {
    const conditions: OvicConditionParam[] = [];
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

  getDatabyKehoach_id(kehoach_id: number): Observable<{ recordsTotal: number, data: ThptKetqua[] }> {
    const conditions: OvicConditionParam[] = [];
    const fromObject = {
      paged: 1,
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

  getdataBythisinhIdAndKehoachId(thisinh_id: number, kehoach_id: number): Observable<ThptKetqua[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'thisinh_id',
        condition: OvicQueryCondition.equal,
        value: thisinh_id.toString()
      },
      {
        conditionName: 'kehoach_id',
        condition: OvicQueryCondition.equal,
        value: kehoach_id.toString()
      },
    ];
    const fromObject = {
      paged: 1,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'id',
      order: "ASC"
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({fromObject}));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => res.data));
  }

  searchbytextAndHoidongId(page: number, search?: string, hoidong_id?: number): Observable<{
    recordsTotal: number,
    data: ThptKetqua[]
  }> {
    const conditions: OvicConditionParam[] = [];
    if (hoidong_id) {
      conditions.push({
        conditionName: 'hoidong_id',
        condition: OvicQueryCondition.equal,
        value: hoidong_id.toString(),
        orWhere: "and"
      })
    }
    if (search) {
      conditions.push(
        {
          conditionName: 'sobd',
          condition: OvicQueryCondition.like,
          value: `%${search}%`,
          orWhere: 'and'
        },
        {
          conditionName: 'hoten',
          condition: OvicQueryCondition.like,
          value: `%${search}%`,
          orWhere:'or'
        },
        {
          conditionName: 'cccd_so',
          condition: OvicQueryCondition.like,
          value: `%${search}%`,
          orWhere: 'or'
        },
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


  getDataUnlimitByHoidongId(hoidong_id:number):Observable<ThptKetqua[]>{
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'hoidong_id',
        condition: OvicQueryCondition.equal,
        value: hoidong_id.toString()
      },
    ];
    const fromObject = {
      paged: 1,
      limit: -1,
      orderby: 'id',
      order: "ASC"
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({fromObject}));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => res.data));
  }

  getDataUnlimitBycccd_soAnd_ngaysinh(cccd_so:number,ngaysinh:string):Observable<ThptKetqua[]>{
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'cccd_so',
        condition: OvicQueryCondition.equal,
        value: cccd_so.toString()
      },
      {
        conditionName: 'ngaysinh',
        condition: OvicQueryCondition.equal,
        value: ngaysinh.toString()
      },
    ];
    const fromObject = {
      paged: 1,
      limit: -1,
      orderby: 'id',
      order: "ASC"
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({fromObject}));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => res.data));
  }

}
