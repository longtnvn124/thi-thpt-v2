import { Injectable } from '@angular/core';
import {getRoute} from "@env";
import {HttpClient, HttpParams} from "@angular/common/http";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {ThptHoiDongThiSinh} from "@shared/models/thpt-model";
import {Dto, OvicConditionParam, OvicQueryCondition} from "@core/models/dto";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {KeHoachThi} from "@shared/services/thpt-kehoach-thi.service";

@Injectable({
  providedIn: 'root'
})
export class ThptHoidongThisinhService {
  private readonly api = getRoute('thpt-kehoach-thi/');

  constructor(
    private http: HttpClient,
    private httpParamsHelper: HttpParamsHeplerService,
    private themeSettingsService: ThemeSettingsService
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
    return this.http.delete(''.concat(this.api, id.toString(10)));
  }

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

  getDataUnlimit(): Observable<KeHoachThi[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'status',
        condition: OvicQueryCondition.equal,
        value: '1',
      },
    ];

    const fromObject = {
      paged: 1,
      limit: -1,

    };
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }
}
