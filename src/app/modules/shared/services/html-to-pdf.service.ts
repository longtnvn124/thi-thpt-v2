import {Injectable} from '@angular/core';
import {OrdersTHPT} from "@shared/services/thpt-orders.service";
import {asBlob} from "@shared/vendor/html-docx";
import {saveAs} from 'file-saver';
// import HTMLtoDOCX from 'html-to-docx';
import {jsPDF} from "jspdf";

const filePath = './example.docx';

@Injectable({
  providedIn: 'root'
})
export class HtmlToPdfService {

  constructor() {
  }


  async expostWordToPDF(item: OrdersTHPT) {

    const htmlString = `
          <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

</head>
<body>
    <p>trần Minh Long đập trai</p>
</body>
</html>

    `;


    const doc = new jsPDF();
    doc.html(htmlString, {
      callback: function (doc) {
        doc.save('A4' + '.pdf');
      }
    });
  }


}
