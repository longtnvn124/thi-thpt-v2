import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Dto, OvicConditionParam, OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { ThemeSettingsService } from '@core/services/theme-settings.service';
import { Observable, map } from 'rxjs';
import { getRoute } from 'src/environments/environment';

export interface ThptHoiDong {
  id: number;
  kehoach_id: number;
  ten_hoidong: number;
  mota: string;
  status: 0 | 1;
}

@Injectable({
  providedIn: 'root'
})
export class ThptHoiDongService {
  private readonly api = getRoute('thpt-hoidongthi/');

  constructor(
    private http: HttpClient,
    private httpParamsHelper: HttpParamsHeplerService,
    private themeSettingsService: ThemeSettingsService,
    private auth: AuthService
  ) { }

  load(page: number): Observable<{ recordsTotal: number, data: ThptHoiDong[] }> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'is_deleted',
        condition: OvicQueryCondition.equal,
        value: '0'
      },
    ];
    const fromObject = {
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'ten_hoidong',
      order: "ASC"
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => ({
      recordsTotal: res.recordsFiltered,
      data: res.data
    })))
  }

  create(data: any): Observable<any> {
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
    return this.update(id, { is_deleted, deleted_by });
  }

  loadDataUnlimit(kehoach_id: number): Observable<ThptHoiDong[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'is_deleted',
        condition: OvicQueryCondition.equal,
        value: '0'
      },
      {
        conditionName: 'kehoach_id',
        condition: OvicQueryCondition.equal,
        value: kehoach_id.toString(),
        orWhere: 'and'
      }
    ];
    const fromObject = {
      paged: 1,
      limit: -1,
      orderby: 'ten_hoidong',
      order: "ASC"
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => (res.data)));
  }


  getHoidongonly(hoidong_id: number): Observable<ThptHoiDong> {
    const conditions: OvicConditionParam[] = [

    ];
    const fromObject = {
      paged: 1,
      orderby: 'ten_hoidong',
      order: "ASC"
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data[0]));
  }
}
