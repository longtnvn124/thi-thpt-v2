import { Injectable } from '@angular/core';
import {map, Observable} from "rxjs";
import {ThptHoiDongThiSinh} from "@shared/models/thpt-model";
import {Dto, OvicConditionParam, OvicQueryCondition} from "@core/models/dto";
import {HttpClient, HttpParams} from "@angular/common/http";
import {KeHoachThi} from "@shared/services/thpt-kehoach-thi.service";
import {getRoute} from "@env";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {AuthService} from "@core/services/auth.service";

export interface ThptPhongThiMonThi{
  id?:number;
  hoidong_id: number;
  phongthi_id: number;
  monthi_id: number;
  thisinh_ids: number[];
  timeStart: string;
}
@Injectable({
  providedIn: 'root'
})
export class ThptPhongthiMonthiService {
  private readonly api = getRoute('thpt-phongthi-monthi/');

  constructor(
    private http: HttpClient,
    private httpParamsHelper: HttpParamsHeplerService,
    private themeSettingsService: ThemeSettingsService,
    private auth: AuthService
  ) {
  }
  load(page: number): Observable<{ recordsTotal: number, data: ThptPhongThiMonThi[] }> {
    const conditions: OvicConditionParam[] = [

    ];
    const fromObject = {
      paged: page,
      limit: this.themeSettingsService.settings.rows,
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => ({
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

    return this.http.delete<Dto>(''.concat(this.api, id.toString(10)));
  }

  // delete(id: number): Observable<any> {
  //   return this.http.delete(''.concat(this.api, id.toString(10)));
  // }

  search(page: number, ten: string): Observable<{ recordsTotal: number, data: ThptPhongThiMonThi[] }> {
    const conditions: OvicConditionParam[] = [];
    const fromObject = {
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'id',
      order: 'ASC'
    };
    if (ten) {
      conditions.push({
        conditionName: 'dotthi',
        condition: OvicQueryCondition.like,
        value: `%${ten}%`,
        orWhere: 'and'
      });
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => ({
      recordsTotal: res.recordsFiltered,
      data: res.data
    })));
  }

  getDataUnlimit(): Observable<KeHoachThi[]> {
    const conditions: OvicConditionParam[] = [

    ];

    const fromObject = {
      paged: 1,
      limit: -1,

    };
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }
  getDataByphongthiIds(ids: number[]): Observable<ThptPhongThiMonThi[]> {
    const conditions: OvicConditionParam[] = [];

    const fromObject = {
      paged: 1,
      limit: -1,
      include: ids.join(','),
      include_by:'phongthi_id'

    };
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'thisinh'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }

}
