
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
  trangthai_thanhtoan: number;
  sotien_thanhtoan: number;
  thoigian_thanhtoan: string;
  status: 1 | 0;
  mon_id: number[];
  tohop_mon_id: number;
  trangthai_chuyenkhoan:number;
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

    return this.http.delete(''.concat(this.api, id.toString(10)));
  }

  getPayment(id: number, url: string, orderDescription:string): Observable<any> {
    const conditions: OvicConditionParam[] = [

    ];
    const fromObject = {
      returnUrl: url,
      orderDescription:orderDescription
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
  getDataByWithThisinhAndSearchAndPage(page: number, kehoach_id: number, search?: string, status?:number): Observable<{ recordsTotal: number, data: OrdersTHPT[] }> {
    const conditions: OvicConditionParam[] = [
    ];
    if (kehoach_id) {
      conditions.push({
        conditionName: 'kehoach_id',
        condition: OvicQueryCondition.equal,
        value: kehoach_id.toString(),
        orWhere: 'and'
      })
    }
    if(status === 1 ){
      conditions.push({
        conditionName: 'trangthai_thanhtoan',
        condition: OvicQueryCondition.equal,
        value: '1',
        orWhere: 'and'
      })
    }
    if(status === 0 ){
      conditions.push({
        conditionName: 'trangthai_thanhtoan',
        condition: OvicQueryCondition.notEqual,
        value: '1',
        orWhere: 'and'
      })
    }

    const fromObject = {
      search: search ? search : '',
      paged: page,
      limit: this.themeSettingsService.settings.rows,
      orderby: 'id',
      order: "DESC"// dieemr giarm dần DESC
    }
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'thisinh'));
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

  getdataByNotThisinhIds(paged: number, thisinh_Ids: number[], kehoach_id: number): Observable<{ data: OrdersTHPT[], recordsTotal: number }> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'kehoach_id',
        condition: OvicQueryCondition.equal,
        value: kehoach_id.toString()
      },
      {
        conditionName: 'trangthai_thanhtoan',
        condition: OvicQueryCondition.equal,
        value: '1',
        orWhere: 'and'
      },
    ];

    const fromObject = {

      paged: paged,
      limit: this.themeSettingsService.settings.rows,
      exclude: thisinh_Ids.join(', '),
      include_by: 'thisinh_id',
      orderby: 'id',
      order: "ASC"// dieemr giarm dần,

    }
    const params = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'thisinh'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => ({
      recordsTotal: res.recordsFiltered,
      data: res.data
    })))
  }

  activeOrder(ids:number[]):Observable<any>{
    return this.http.post<Dto>(this.api +'active-order/', {ids: ids});
  }

  getDataByKehoachId(kehoach_id: number): Observable<OrdersTHPT[]> {
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'kehoach_id',
        condition: OvicQueryCondition.equal,
        value: kehoach_id.toString(),
      },

    ];
    const fromObject = {
      paged: 1,
      limit: -1,
      orderby: 'id',
      order: "ASC",// dieemr giarm dần,

    }
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'thisinh'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }

  getDataBykehoachIdAndStatusUnlimit(kehoach_id:number, unIds ?: number[], type_thanhtoan?:number):Observable<OrdersTHPT[]>{
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'kehoach_id',
        condition: OvicQueryCondition.equal,
        value: kehoach_id.toString(),
      },


    ];
    if(type_thanhtoan ===1){
      const item:OvicConditionParam = {
        conditionName: 'trangthai_thanhtoan',
        condition: OvicQueryCondition.equal,
        value:'1',
        orWhere:"and"
      }
      conditions.push(item)
    }

    if(type_thanhtoan ===0){
      const item1:OvicConditionParam = {
        conditionName: 'trangthai_thanhtoan',
        condition: OvicQueryCondition.notEqual,
        value:'1',
        orWhere:"and"
      }

      conditions.push(item1)
    }


    const fromObject = {
      paged: 1,
      limit: -1,
      orderby: 'id',
      order: "ASC",// dieemr giarm dần,
      exclude:unIds.join(','),
      exclude_by:"thisinh_id"


    }
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }).set('with', 'thisinh'));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }

  getTotalOrder():Observable<number>{
    return this.http.get<Dto>(this.api).pipe(map(res => res.recordsFiltered));

  }

  getTotalLephithi():Observable<number>{
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'trangthai_thanhtoan',
        condition: OvicQueryCondition.equal,
        value: '1',
      }
    ];
    const fromObject = {
      sum:'lephithi'
    }
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data[0]['sum_lephithi']));
  }
  getCountTT():Observable<number>{
    const conditions: OvicConditionParam[] = [
      {
        conditionName: 'trangthai_thanhtoan',
        condition: OvicQueryCondition.equal,
        value: '1',
      }
    ];
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions, );
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.recordsFiltered));
  }

  getCountTTbykehoachIds(kehoach_ids:number[]):Observable<OrdersTHPT[]>{
    const conditions: OvicConditionParam[] = [
    ];
    const fromObject = {
      paged: 1,
      limit: -1,
      orderby: 'id',
      order: "ASC",// dieemr giarm dần,
      include:kehoach_ids.join(','),
      include_by:"kehoach_id",
      select:'id,kehoach_id,trangthai_thanhtoan,mon_id',
    }
    const params: HttpParams = this.httpParamsHelper.paramsConditionBuilder(conditions, new HttpParams({ fromObject }));
    return this.http.get<Dto>(this.api, { params }).pipe(map(res => res.data));
  }
}
