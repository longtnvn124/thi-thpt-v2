import {Injectable} from '@angular/core';
import { saveAs } from 'file-saver';
import {ThptHoiDongPhongThi} from "@shared/models/thpt-model";
import {asBlob} from "@shared/vendor/html-docx";
import {FileService} from "@core/services/file.service";
import {concatMap, from} from "rxjs";
import {map} from "rxjs/operators";
import jsPDF from "jspdf";

const filePath = './example.docx';

@Injectable({
  providedIn: 'root'
})
export class HtmlToPdfService {

  constructor(
    private fileService: FileService

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
        const sbd= 'TNU' + item.id ;
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

  private  processData(thisinhInphong) {
    return from(thisinhInphong).pipe(
      concatMap(a => {
        const thisinhFileId = a['anh_chandung'][0].id;
        return this.fileService.getImageContent(thisinhFileId.toString()).pipe(
          map(data => {
            console.log(data);
            a['__img_object'] = data;
            return a;
          })
        );
      })
    );
  }


  textHtmlToWord(htmlContent:string, fileName:string) {
    // var doc = new jsPDF();
    // const html2= ` let htmlContent =  \`<!DOCTYPE html>
    //     <html lang="en">
    //         <head>
    //           <meta charset="UTF-8">
    //           <title>Document</title>
    //         </head>
    //         <body>
    //              Trần Minh Long
    //         </body></html>`
    const html =`<b style="font-family: "Times New Roman", Times, serif;">long trần </b>`

    var doc = new jsPDF();

    // doc.setFont("Times New Roman", "normal");
    doc.setFont("times", "normal");
    doc.setFontSize(14);

    const node : HTMLElement = document.createElement('div');

    node.innerHTML = html;

    doc.html(node, {
      callback: function (doc) {
        doc.save();
      },
      x: 10,
      y: 10
    });
  }
}
