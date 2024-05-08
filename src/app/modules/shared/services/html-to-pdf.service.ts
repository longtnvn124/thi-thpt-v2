import { Injectable } from '@angular/core';
import {OrdersTHPT} from "@shared/services/thpt-orders.service";
import {asBlob} from "@shared/vendor/html-docx";
import { saveAs } from 'file-saver';
// import HTMLtoDOCX from 'html-to-docx';
import { jsPDF } from "jspdf";

const filePath = './example.docx';
@Injectable({
  providedIn: 'root'
})
export class HtmlToPdfService {

  constructor() { }


  async expostWordToPDF(item:OrdersTHPT){
    const htmlString= `<div style="width:100%; height:100%;display:block;">
        <table>
            <tr>
                <td style="width:300px;">
                    <img style="padding:50px 0 0 0; height: 100px;" src="src/assets/images/logo-tnu.png" alt="">
                </td>
                <td style="width:calc(100% - 300px)">
                     <div style="text-align: right">
                        <p></p>
                     </div>
                </td>
            </tr>
        </table>
    </div>`;

    const doc = new jsPDF();

    doc.text(htmlString, 0, 0);
    doc.save("a4.pdf");
  }


}
