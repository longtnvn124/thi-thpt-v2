
import { Injectable } from '@angular/core';
import { getRoute } from "@env";
import { HttpClient, HttpParams } from "@angular/common/http";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { ThemeSettingsService } from "@core/services/theme-settings.service";
import { AuthService } from "@core/services/auth.service";
import { map, Observable } from "rxjs";
import { Dto, OvicConditionParam, OvicQueryCondition } from "@core/models/dto";

export interface OrdersTHPT {
  id: number;
  thisinh_id: number;
  kehoach_id: number;
  mota: string;
  lephithi: number;
  trangthai_thanhtoan: 0 | 1;
  sotien_thanhtoan: number;
  thoigian_thanhtoan: string;
  status: 1 | 0;
  mon_id: number[];
  tohop_mon_id: number;
}
@Injectable({
  providedIn: 'root'
})
export class ThptOrdersService {
  private api = getRoute('thpt-orders/');

  constructor(
    private http: HttpClient,
    private httpParamsHelper: HttpParamsHeplerService,
    private themeSettingsService: ThemeSettingsService,
    private auth: AuthService
  ) { }

  getUserInfo(user_id: number): Observable<OrdersTHPT> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'thisinh_id',
        condition: OvicQueryCondition.equal,
        value: user_id.toString(),
      },
      {
        conditionName: 'is_deleted',
        condition: OvicQueryCondition.equal,
        value: '0',
        orWhere: 'and'
      },
    ];
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions);
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data && res.data[0] ? res.data[0] : null));

  }

  load(page: number, search?: string): Observable<{ recordsTotal: number, data: OrdersTHPT[] }> {
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
    data['updated_by'] = this.auth.user.id;
    return this.http.put<Dto>(''.concat(this.api, id.toString(10)), data);
  }

  delete(id: number): Observable<any> {
    const is_deleted = 1;
    const deleted_by = this.auth.user.id;
    return this.update(id, { is_deleted, deleted_by });
  }

  getPayment(id: number, url: string): Observable<any> {
    const conditions: OvicConditionParam[] = [

    ];
    const fromObject = {
      returnUrl: url,
    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(''.concat(this.api, id.toString(10) + '/create-payment-url'), { params }).pipe(map(res => res.data));
  }
  checkPaymentByUser(text: string): Observable<any> {
    const url = text ? ''.concat(getRoute('thpt-orders/return'), text) : this.api;
    return this.http.get<Dto>(url).pipe(map(res => res.data));
  }


  getdata(user_id: number): Observable<OrdersTHPT[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'thisinh_id',
        condition: OvicQueryCondition.equal,
        value: user_id.toString(),
      },
      {
        conditionName: 'is_deleted',
        condition: OvicQueryCondition.equal,
        value: '0',
        orWhere: 'and'
      },
    ];
    const fromObject = {

    }
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'monhoc'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }
  getDataByCreatedBy(user_id: number): Observable<OrdersTHPT[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'created_by',
        condition: OvicQueryCondition.equal,
        value: user_id.toString(),
      },
      {
        conditionName: 'is_deleted',
        condition: OvicQueryCondition.equal,
        value: '0',
        orWhere: 'and'
      },
    ];
    const fromObject = {

    }
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'monhoc'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }

  getDataByIdthisinh(thisinh_id: number): Observable<OrdersTHPT[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'thisinh_id',
        condition: OvicQueryCondition.equal,
        value: thisinh_id.toString(),
      },
      {
        conditionName: 'is_deleted',
        condition: OvicQueryCondition.equal,
        value: '0',
        orWhere: 'and'
      },
    ];
    const fromObject = {

    }
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'monhoc'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }

  // getDataByWithThisinh()
  getDataByWithThisinhAndSearchAndPage(page: number, kehoach_id: number, search?: string): Observable<{ recordsTotal: number, data: OrdersTHPT[] }> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'is_deleted',
        condition: OvicQueryCondition.equal,
        value: '0',

      },
    ];
    if (kehoach_id) {
      conditions.push({
        conditionName: 'kehoach_id',
        condition: OvicQueryCondition.equal,
        value: kehoach_id.toString(),
        orWhere: 'and'
      })
    }
    const fromObject = {
      thisinh_hoten: search && search !== null || search && search !== undefined ? search : '',
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'status',
      order: "DESC"// dieemr giarm dần
    }
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'thisinh,monhoc'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => ({ data: res.data, recordsTotal: res.recordsFiltered })));
  }

  getDataByKehoachIdAndStatus(kehoach_id: number): Observable<OrdersTHPT[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'kehoach_id',
        condition: OvicQueryCondition.equal,
        value: kehoach_id.toString(),
      },
      {
        conditionName: 'trangthai_thanhtoan',
        condition: OvicQueryCondition.equal,
        value: '1',
        orWhere: 'and'
      }
    ];
    const fromObject = {

      paged: 1,
      limit: -1,
      orderby: 'status',
      order: "ASC"// dieemr giarm dần,

    }
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'thisinh,monhoc'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }
}
