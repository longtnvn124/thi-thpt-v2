import { Injectable } from '@angular/core';
import { getRoute } from "@env";
import { HttpClient, HttpParams } from "@angular/common/http";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { ThemeSettingsService } from "@core/services/theme-settings.service";
import { map, Observable } from "rxjs";

import { Dto, OvicConditionParam } from "@core/models/dto";

export interface DmPhongThi {
  id?: number;
  fromAt: number;
  toAt: number;
  soluong: number;
}
@Injectable({
  providedIn: 'root'
})
export class DanhMucPhongThiService {

  private readonly api = getRoute('danhmuc-phongthi/');

  constructor(
    private http: HttpClient,
    private httpParamsHelper: HttpParamsHeplerService,
    private themeSettingsService: ThemeSettingsService
  ) {
  }

  load(page: number): Observable<{ recordsTotal: number, data: DmPhongThi[] }> {
    const conditions: OvicConditionParam[] = [

    ];
    const fromObject = {
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'id',
      order: "ASC"
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
}
