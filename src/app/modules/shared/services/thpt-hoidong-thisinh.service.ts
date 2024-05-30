import { AuthService } from '@core/services/auth.service';
import { Injectable } from '@angular/core';
import { getRoute } from "@env";
import { HttpClient, HttpParams } from "@angular/common/http";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { ThemeSettingsService } from "@core/services/theme-settings.service";
import { ThptHoiDongThiSinh } from "@shared/models/thpt-model";
import { Dto, OvicConditionParam, OvicQueryCondition } from "@core/models/dto";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { KeHoachThi } from "@shared/services/thpt-kehoach-thi.service";

@Injectable({
  providedIn: 'root'
})
export class ThptHoidongThisinhService {
  private readonly api = getRoute('thpt-hoidong-thisinh/');

  constructor(
    private http: HttpClient,
    private httpParamsHelper: HttpParamsHeplerService,
    private themeSettingsService: ThemeSettingsService,
    private auth: AuthService
  ) {
  }

  load(page: number): Observable<{ recordsTotal: number, data: ThptHoiDongThiSinh[] }> {
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
    const is_deleted = 1;
    const deleted_by = this.auth.user.id;
    return this.update(id, { is_deleted, deleted_by });
  }

  // delete(id: number): Observable<any> {
  //   return this.http.delete(''.concat(this.api, id.toString(10)));
  // }

  search(page: number, ten: string): Observable<{ recordsTotal: number, data: ThptHoiDongThiSinh[] }> {
    const conditions: OvicConditionParam[] = [];
    const fromObject = {
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'phongthi_id',
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

  getDataUnlimit(): Observable<ThptHoiDongThiSinh[]> {
    const conditions: OvicConditionParam[] = [
    ];

    const fromObject = {
      paged: 1,
      limit: -1,

    };
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }

  getDataByPhongthiAndHoidongId(page: number, phongthi_id: number, hoidong_id: number): Observable<{ recordsTotal: number, data: ThptHoiDongThiSinh[] }> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'phongthi_id',
        condition: OvicQueryCondition.equal,
        value: phongthi_id.toString(),
      },
      {
        conditionName: 'hoidong_id',
        condition: OvicQueryCondition.equal,
        value: hoidong_id.toString(),
        orWhere: 'and'
      },
    ];

    const fromObject = {
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'id',
      order: 'ASC'
    };
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'thisinh'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => ({
      recordsTotal: res.recordsFiltered,
      data: res.data
    })))
  }

  getDataByPhongthiAndHoidongIdnotPage(phongthi_id: number, hoidong_id: number): Observable<ThptHoiDongThiSinh[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'phongthi_id',
        condition: OvicQueryCondition.equal,
        value: phongthi_id.toString(),
      },
      {
        conditionName: 'hoidong_id',
        condition: OvicQueryCondition.equal,
        value: hoidong_id.toString(),
        orWhere: 'and'
      },
    ];

    const fromObject = {
      paged: 1,
      limit: -1,
      orderby: 'id',
      order: 'ASC'
    };
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'thisinh'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }

  getDataByHoiDongId(page: number, hoidong_id: number): Observable<{ recordsTotal: number, data: ThptHoiDongThiSinh[] }> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'hoidong_id',
        condition: OvicQueryCondition.equal,
        value: hoidong_id.toString(),
      },
    ];

    const fromObject = {
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'id',
      order: 'ASC'
    };
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'thisinh'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => ({
      recordsTotal: res.recordsFiltered,
      data: res.data
    })))
  }

  getDataByHoidongIdUnlimit(hoidong_id: number, phongthi?:number): Observable<ThptHoiDongThiSinh[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'hoidong_id',
        condition: OvicQueryCondition.equal,
        value: hoidong_id.toString(),
      }

    ];
    if(phongthi){
      conditions.push({
        conditionName: 'phongthi',
        condition: OvicQueryCondition.equal,
        value: phongthi.toString(),
        orWhere:'and'

      })
    }

    const fromObject = {
      paged: 1,
      limit: -1,
      orderby: 'id',
      order: 'ASC'
    };
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'thisinh,orders'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }

  getDataByHoiDongIdNotPage(hoidong_id: number): Observable<ThptHoiDongThiSinh[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'hoidong_id',
        condition: OvicQueryCondition.equal,
        value: hoidong_id.toString(),
      },
    ];

    const fromObject = {
      paged: 1,
      limit: -1,
    };
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'thisinh'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res =>  res.data));
  }
  getDataByHoidongIdAndThisinhId(hoidong_id:number,thisinh_id:number):Observable<ThptHoiDongThiSinh[]>{
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'hoidong_id',
        condition: OvicQueryCondition.equal,
        value: hoidong_id.toString(),
      },
      {
        conditionName: 'thisinh_id',
        condition: OvicQueryCondition.equal,
        value: thisinh_id.toString(),
        orWhere:'and'
      },
    ];

    const fromObject = {
      paged:1,
      limit:-1
    };
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res =>  res.data));
  }

  getDataByHoidongIdUnlimitnotOrder(hoidong_id: number, phongthi?:number): Observable<ThptHoiDongThiSinh[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'hoidong_id',
        condition: OvicQueryCondition.equal,
        value: hoidong_id.toString(),
      }

    ];
    if(phongthi){
      conditions.push({
        conditionName: 'phongthi',
        condition: OvicQueryCondition.equal,
        value: phongthi.toString(),
        orWhere:'and'

      })
    }

    const fromObject = {
      paged: 1,
      limit: -1,
      orderby: 'id',
      order: 'ASC'
    };
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'thisinh'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }

}
