import {Injectable} from '@angular/core';
import { saveAs } from 'file-saver';
import {ThptHoiDongPhongThi} from "@shared/models/thpt-model";
import {asBlob} from "@shared/vendor/html-docx";
import {FileService} from "@core/services/file.service";
import {concatMap, from} from "rxjs";
import {map} from "rxjs/operators";
import jsPDF from "jspdf";
import {DmPhongThi} from "@shared/services/danh-muc-phong-thi.service";
import {NotificationService} from "@core/services/notification.service";

const filePath = './example.docx';

@Injectable({
  providedIn: 'root'
})
export class HtmlToPdfService {

  constructor(
    private fileService: FileService,
    private notificationService:NotificationService

  ) {
  }

  async exportHtmlToWord(item:ThptHoiDongPhongThi[], fileName: string){
    let htmlContent =  `<!DOCTYPE html>
        <html lang="en">
            <head>
              <meta charset="UTF-8">
              <title>Document</title>


            </head>
            <body>
                <table style="width:100%;">
                    <tr>
                        <td>
                            <div style="width:100%; display: block; text-align: center;">
                                <p style="margin: 0;">ĐẠI HỌC THÁI NGUYÊN</p>
                                <p style="margin: 0;"><strong>HỘI ĐỒNG THI ĐGĐV ĐẠI HỌC</strong></p>
                                <p style="margin: 0;"><strong>TRÊN MÁY TÍNH NĂM …</strong></p>
                            </div>
                        </td>
                        <td>
                            <div style="width:100%; display: block; text-align: center;">
                                <p style="margin:0"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
                                <p style="margin:0"><strong>Độc lập - Tự do - Hạnh phúc</strong></p>
                            </div>
                        </td>
                    </tr>
                </table>
            `;
    item.forEach(phongthi=>{

      htmlContent += `
        <table style="width:100%;padding: 40px 0;">
            <tr>
                <td>
                    <div style="display: flex; flex-direction: column; justify-content: center">
                        <p style="margin:0"><strong>CA THI: </strong> <span>${phongthi['__ten_cathi']}</span></p>
                        <p style="margin:0"><strong>NGÀY THI: </strong> <span>${phongthi['__ngaythi']}</span></p>
                        <p style="margin:0"><strong>PHÒNG THI: </strong> <span>${phongthi.ten_phongthi}</span></p>
                    </div>
                </td>
                <td>
                    <div style="display: block; text-align: center">
                        <p style="margin:0;font-size: 16px;"><strong>DANH SÁCH ẢNH THÍ SINH</strong></p>
                        <p style="margin:0;font-size: 16px;;"><strong>KỲ THI NGÀY …</strong></p>
                    </div>
                </td>
            </tr>
        </table>
      `;

      htmlContent += `
        <table style="width: 100%;border-collapse: collapse;padding:20px;">

            `;

      const thisinhs = phongthi['__thisinh_in_phong']
      thisinhs.forEach((item ,index)=>{
        const sbd= phongthi['hoidong'].tiento_sobaodanh + this.covertId(item.id) ;
        // const imgObject =  item['__img_object'];
        const hoten = item['hoten'];
        const cccd = item['cccd_so'];
        if(index % 3 == 0){
          htmlContent += `<tr>`;
        }
        htmlContent += `<td style="border: 1px solid #393939;padding: 8px;">
                <div style="display: block;width: 100%; text-align: center;">
                    <div style="width:100%">
                    <img width="150" height="225" src="${item['_avatarSrc']}">
                    </div>
                    <p style="margin:0;font-size:13px;">${sbd}</p>
                    <p style="margin:0;font-size:13px;">${hoten}</p>
                    <p style="margin:0;font-size:13px;">${cccd}</p>
                </div>
            </td>`;
        if((index + 1) % 3 == 0 ){
          htmlContent += `</tr>`;
        }
      })

      htmlContent += `</table>`;
    })

    htmlContent +=`</body></html>`;
    try {
    			const fileBuffer = await asBlob(htmlContent , {
    				orientation : 'portrait' ,
    				margins     : {
    					top    : 1000 ,
    					right  : 1000 ,
    					bottom : 1000 ,
    					left   : 1000 ,
    					header : 440 ,
    					footer : 0 ,
    					gutter : 0
    				}
    			} );
    			saveAs( fileBuffer , fileName + '.docx' );

    		} catch ( e ) {
    			console.log( e );
    		}
  }

  async exportHtmlToWordV2(item:DmPhongThi[], fileName: string){
    this.notificationService.isProcessing(true);
    let htmlContent =  `<!DOCTYPE html>
        <html lang="en">
            <head>
              <meta charset="UTF-8">
              <title>Document</title>


            </head>
            <body>
                <table style="width:100%;">
                    <tr>
                        <td>
                            <div style="width:100%; display: block; text-align: center;">
                                <p style="margin: 0;">ĐẠI HỌC THÁI NGUYÊN</p>
                                <p style="margin: 0;"><strong>HỘI ĐỒNG THI ĐGĐV ĐẠI HỌC</strong></p>
                                <p style="margin: 0;"><strong>TRÊN MÁY TÍNH NĂM …</strong></p>
                            </div>
                        </td>
                        <td>
                            <div style="width:100%; display: block; text-align: center;">
                                <p style="margin:0"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
                                <p style="margin:0"><strong>Độc lập - Tự do - Hạnh phúc</strong></p>
                            </div>
                        </td>
                    </tr>
                </table>
            `;
    item.forEach(phongthi=>{

      htmlContent += `

        <table style="width:100%;padding: 40px 0;">
            <tr>
                <td>
                    <div style="display: flex; flex-direction: column; justify-content: center">
                        <p style="margin:0"><strong>CA THI: ...</span></p>
                        <p style="margin:0"><strong>NGÀY THI: </strong> <span>02/06/2024</span></p>
                        <p style="margin:0"><strong>PHÒNG THI: </strong> <span>${phongthi['phongso']}</span></p>
                    </div>
                </td>
                <td>
                    <div style="display: block; text-align: center">
                        <p style="margin:0;font-size: 16px;"><strong>DANH SÁCH ẢNH THÍ SINH</strong></p>
                        <p style="margin:0;font-size: 16px;;"><strong>KỲ THI NGÀY …</strong></p>
                    </div>
                </td>
            </tr>
        </table>
      `;

      htmlContent += `
        <table style="width: 100%;border-collapse: collapse;padding:20px;">

            `;

      const thisinhs = phongthi['thisinhs']

      thisinhs.forEach((item ,index)=>{
        const sbd= item['hoidong'].tiento_sobaodanh + this.covertId(item.id) ;
        // const imgObject =  item['__img_object'];
        const hoten = item['thisinh']['hoten'];
        const cccd = item['thisinh']['cccd_so'];
        if(index % 3 == 0){
          htmlContent += `<tr>`;
        }
        htmlContent += `<td style="border: 1px solid #393939;padding: 8px;">
                <div style="display: block;width: 100%; text-align: center;">
                    <div style="width:100%">
                    <img width="150" height="225" src="${item['_avatarSrc']}">
                    </div>
                    <p style="margin:0;font-size:13px;">${sbd}</p>
                    <p style="margin:0;font-size:13px;">${hoten}</p>
                    <p style="margin:0;font-size:13px;">${cccd}</p>
                </div>
            </td>`;
        if((index + 1) % 3 == 0 ){
          htmlContent += `</tr>`;
        }
      })

      htmlContent += `</table>
      <p style="page-break-inside: auto;"></p>
    `;
    })

    htmlContent +=`</body></html>`;
    try {
      const fileBuffer = await asBlob(htmlContent , {
        orientation : 'portrait' ,
        margins     : {
          top    : 1000 ,
          right  : 1000 ,
          bottom : 1000 ,
          left   : 1000 ,
          header : 440 ,
          footer : 0 ,
          gutter : 0
        }
      } );
      await saveAs( fileBuffer , fileName + '.docx' );

    } catch ( e ) {
      console.log( e );
    }
  }



  covertId(iput:number){
    return iput<10? '000'+iput: (iput>=10 && iput<100 ? '00'+ iput : (iput>=100 && iput<1000 ? '0' +iput :iput));
  }
}
