import { Injectable } from '@angular/core';
import {getRoute} from "@env";
import {map, Observable} from "rxjs";

import {Dto, OvicConditionParam, OvicQueryCondition} from "@core/models/dto";
import {HttpClient, HttpParams} from "@angular/common/http";
import {ThemeSettingsService} from "@core/services/theme-settings.service";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {AuthService} from "@core/services/auth.service";
import {ThiSinhInfo} from "@shared/models/thi-sinh";


@Injectable({
  providedIn: 'root'
})
export class ThisinhInfoService {
  private api = getRoute( 'thpt-thisinh/' );

  constructor(
    private http: HttpClient,
    private httpParamsHelper: HttpParamsHeplerService,
    private themeSettingsService: ThemeSettingsService,
    private auth: AuthService
  ) { }

  getUserInfo(user_id :number): Observable<ThiSinhInfo> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'user_id',
        condition: OvicQueryCondition.equal,
        value: user_id.toString(),
      },
    ];
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions);
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => res.data && res.data[0] ? res.data[0] : null));

  }

  load(page: number, search?: string): Observable<{ recordsTotal: number, data: ThiSinhInfo[] }> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'is_deleted',
        condition: OvicQueryCondition.equal,
        value: '0'
      },
    ];
    if (search) {
      conditions.push({
        conditionName: 'hoten',
        condition: OvicQueryCondition.like,
        value: `%${search}%`,
        orWhere: "and"
      })
    }
    const fromObject = {
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'user_id',
      order: "ASC"
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({fromObject}));
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => ({
      recordsTotal: res.recordsFiltered,
      data: res.data
    })))

  }

  create(data: any): Observable<number> {
    data['created_by'] = this.auth.user.id;
    return this.http.post<Dto>(this.api, data).pipe(map(res => res.data));
  }

  update(id: number, data: any): Observable<any> {
    data['updated_by'] = this.auth.user.id;
    return this.http.put<Dto>(''.concat(this.api, id.toString(10)), data);
  }

  delete(id: number): Observable<any> {
    const is_deleted = 1;
    const deleted_by = this.auth.user.id;
    return this.update(id, {is_deleted, deleted_by});
  }


  getUserById(id :number): Observable<ThiSinhInfo> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'id',
        condition: OvicQueryCondition.equal,
        value: id.toString(),
      },
    ];
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions);
    return this.http.get<Dto>(this.api, {params}).pipe(map(res => res.data && res.data[0] ? res.data[0] : null));

  }
}
