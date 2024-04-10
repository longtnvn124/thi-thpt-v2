import { Injectable } from '@angular/core';
import { getRoute } from "@env";
import { HttpClient, HttpParams } from "@angular/common/http";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { ThemeSettingsService } from "@core/services/theme-settings.service";
import { AuthService } from "@core/services/auth.service";
import { map, Observable } from "rxjs";
import { Dto, OvicConditionParam, OvicQueryCondition } from "@core/models/dto";

export interface HoiDapTHPT {
  id: number;
  question: string;
  answer: string;
  status
}
@Injectable({
  providedIn: 'root'
})
export class ThptHoiDapService {
  private readonly api = getRoute('hoi-dap/');

  constructor(
    private http: HttpClient,
    private httpParamsHelper: HttpParamsHeplerService,
    private themeSettingsService: ThemeSettingsService,
    private auth: AuthService
  ) {
  }

  load(page: number): Observable<{ recordsTotal: number, data: HoiDapTHPT[] }> {
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
      orderby: 'question',
      order: "ASC"
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => ({
      recordsTotal: res.recordsFiltered,
      data: res.data
    })))
  }

  create(data: any): Observable<number> {
    data['created_by'] = this.auth.user.id;
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

  search(page: number, select: string = null, search: string): Observable<{ recordsTotal: number, data: HoiDapTHPT[] }> {
    const conditions: OvicConditionParam[] = [

    ];
    if (search) {
      const c1: OvicConditionParam[] = [
        {
          conditionName: 'question',
          condition: OvicQueryCondition.like,
          value: `%${search}%`,
          orWhere: 'and'
        },
      ];
      conditions.push(...c1);
    }

    const fromObject = {
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'question',
      order: 'ASC'
    };
    if (select) {
      fromObject['select'] = select;
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => ({
      recordsTotal: res.recordsTotal,
      data: res.data
    })));
  }

  getDataUnlimit(): Observable<HoiDapTHPT[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'status',
        condition: OvicQueryCondition.equal,
        value: '1',
      }
    ];
    const fromObject = {
      paged: 1,
      limit: -1,
      orderby: 'ten',
      order: "ASC"
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }
}
