import { Injectable } from '@angular/core';
import { OrdersTHPT } from "@shared/services/thpt-orders.service";
import { asBlob } from "@shared/vendor/html-docx";
import { saveAs } from 'file-saver';
// import HTMLtoDOCX from 'html-to-docx';
import { jsPDF } from "jspdf";

const filePath = './example.docx';
@Injectable({
  providedIn: 'root'
})
export class HtmlToPdfService {

  constructor() { }


  async expostWordToPDF(item: OrdersTHPT) {

    const htmlString = `
      <div style="width: 100%;">
        <table style="width: 100%;">
          <tr>
            <td style="width:20%;">1</td>
            <td style="width:80%;">2</td>
          </tr>
        </table>
      </div>
    `;


    const doc = new jsPDF();
    doc.html(htmlString, {
      callback: function (doc) {
        doc.save('A4' + '.pdf');
      }
    });
  }


}
