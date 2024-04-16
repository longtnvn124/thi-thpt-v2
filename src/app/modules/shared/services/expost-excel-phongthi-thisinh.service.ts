import { Injectable } from '@angular/core';
import * as fs from 'file-saver';
import { Workbook } from 'exceljs';
import * as XLSX from 'xlsx';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';
@Injectable({
  providedIn: 'root'
})
export class ExpostExcelPhongthiThisinhService {
  constructor() { }

  public exportExcel(
    json: any[],
    headersArray: any[],// column name
    excelFileName: string,
    reportHeading: string,
    subHeader?: string
  ): void {
    console.log(reportHeading);
    const header = headersArray;
    const workbook = new Workbook();
    workbook.created = new Date();
    workbook.modified = new Date();
    json.forEach((f, index) => {
      const worksheet = workbook.addWorksheet("Phòng " + (index + 1).toString());
      const phongthi = f;
      const thisinh = f['_thisinh'];
      console.log(thisinh);


      worksheet.addRow([]);
      worksheet.mergeCells('A1:' + this.numToAlpha(header.length - 1) + '1');
      worksheet.getCell('A1').value = reportHeading;
      worksheet.getCell('A1').alignment = { horizontal: 'center' };
      worksheet.getCell('A1').font = { size: 24, bold: true, name: 'Times New Roman' };
      if (phongthi.ten_phongthi !== '') {
        worksheet.addRow([]);
        worksheet.mergeCells('A2:' + this.numToAlpha(header.length - 1) + '2');
        worksheet.getCell('A2').value = phongthi.ten_phongthi;
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        worksheet.getCell('A2').font = { size: 13, bold: false, name: 'Times New Roman' };
      }
      worksheet.addRow([]);
      const headerRow = worksheet.addRow(header);
      headerRow.eachCell((cell, index) => {

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'CCCCCC' },
          bgColor: { argb: '000000' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.font = { size: 13, bold: true, name: 'Times New Roman' };
        cell.alignment = { horizontal: 'center' };


        worksheet.getColumn(index).width = header[index - 1].length < 20 ? 20 : header[index - 1].length;
        worksheet.getColumn(1).width = 7;
        worksheet.getColumn(1).alignment = { horizontal: 'center' };
      });

      let columnsArray: any[];
      for (const key in thisinh) {
        if (json.hasOwnProperty(key)) {
          columnsArray = Object.keys(thisinh[key]);
        }
      }

      thisinh.forEach((element: any) => {
        const eachRow = [];
        columnsArray.forEach((column) => {
          eachRow.push(element[column]);

        });

        if (element.isDeleted === 'Y') {
          const deleteRow = worksheet.addRow(eachRow);
          deleteRow.eachCell((cell) => {
            cell.font = { name: 'Times New Roman', family: 4, size: 11, bold: false, strike: true };

          })
        } else {
          worksheet.addRow(eachRow);
        }
        //set with column to fit
        worksheet.columns.forEach((column, columnIndex) => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const cellLength = cell.value ? cell.value.toString().length : 0;
            maxLength = cellLength;
          });
          // worksheet.getColumn(columnIndex + 1).width = maxLength + 2;
        });

      });






    })

    workbook.xlsx.writeBuffer().then((data: ArrayBuffer) => {
      const blob = new Blob([data], { type: EXCEL_TYPE });
      fs.saveAs(blob, excelFileName + EXCEL_EXTENSION);
    })
    console.log(workbook);
  }

  private numToAlpha(num: number) {
    let alpha = '';
    for (; num >= 0; num = parseInt((num / 26).toString(), 10) - 1) {
      alpha = String.fromCharCode(num % 26 + 0x41) + alpha;
    }
    return alpha;
  }

}
