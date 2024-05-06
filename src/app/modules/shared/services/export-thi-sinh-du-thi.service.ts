import { Injectable } from '@angular/core';
import {Workbook} from "exceljs";
import * as fs from 'file-saver';
// const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
// const EXCEL_EXTENSION = '.xlsx';
@Injectable({
  providedIn: 'root'
})
export class ExportThiSinhDuThiService {

  constructor() { }

  exportToLong(object:any, title:string) {

    const wb = new Workbook();
    const worksheet = wb.addWorksheet('Danh sách thí sinh', { pageSetup: { paperSize: 9, orientation: 'portrait' } });

    const text_header = 'TRẠNG THÁI ĐĂNG KÝ THI V-SAT-TNU ('+ title +')';
    worksheet.addRow([text_header]);
    worksheet.addRow([""]);
    const header =
      [
        [
          "STT",
          "ID",
          "MADK",
          "Trạng thái",
          "Họ và tên",
          "Ngày sinh",
          "Giới tính",
          "CCCD/CMND",
          "Email",
          "Điện thoại",
          "Môn đăng ký thi"
        ],
        [
          "",
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          "Toán",
          "Vật lí",
          "Hoá học",
          "Sinh học",
          "Lịch sử",
          "Địa lí",
          "Tiếng Anh"
        ]
      ]

    worksheet.pageSetup.margins = {
      left: 0, right: 0,
      top: 0.4, bottom: 0.4,
      header: 0.3, footer: 0.3
    };


    header.forEach((d, index) => {
      const row = worksheet.addRow(d);
      row.worksheet.pageSetup.showRowColHeaders = true;
      row.eachCell((cell, number) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF' },
          bgColor: { argb: 'FFFFFF' },
        };
        cell.font = { name: 'Times New Roman', family: 1, size: 12, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center', shrinkToFit: true, wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: '333333' } },
          left: { style: 'thin', color: { argb: '333333' } },
          bottom: { style: 'thin', color: { argb: '333333' } },
          right: { style: 'thin', color: { argb: '333333' } }
        };
      });
    })

    worksheet.mergeCells('A1:Q1');
    this.setCellProperties(worksheet.getCell('A1'), 14, { bold: true });

    worksheet.mergeCells('A3:A4');
    this.setCellProperties(worksheet.getCell('A3'), 14, { bold: true });
    worksheet.mergeCells('B3:B4');
    this.setCellProperties(worksheet.getCell('A3'), 14, { bold: true });
    worksheet.mergeCells('C3:C4');
    this.setCellProperties(worksheet.getCell('A3'), 14, { bold: true });
    worksheet.mergeCells('D3:D4');
    this.setCellProperties(worksheet.getCell('A3'), 14, { bold: true });
    worksheet.mergeCells('E3:E4');
    this.setCellProperties(worksheet.getCell('A3'), 14, { bold: true });
    worksheet.mergeCells('F3:F4');
    this.setCellProperties(worksheet.getCell('A3'), 14, { bold: true });
    worksheet.mergeCells('G3:G4');
    this.setCellProperties(worksheet.getCell('A3'), 14, { bold: true });
    worksheet.mergeCells('H3:H4');
    this.setCellProperties(worksheet.getCell('A3'), 14, { bold: true });
    worksheet.mergeCells('I3:I4');
    this.setCellProperties(worksheet.getCell('A3'), 14, { bold: true });
    worksheet.mergeCells('J3:J4');
    this.setCellProperties(worksheet.getCell('A3'), 14, { bold: true });

    worksheet.mergeCells('K3:Q3');
    this.setCellProperties(worksheet.getCell('K3'), 14, { bold: true });


    const objectColWidth = {
      1: 6,
      2: 6,
      3: 12,
      4: 25,
      5: 25,
      6: 13,
      7: 13,
      8: 18,
      9: 34,
      10: 13,
      11: 12,
      12: 12,
      13: 12,
      14: 12,
      15: 12,
      16: 12,
      17: 12,

    };

    this.setColWidth(worksheet, objectColWidth);

    // Get all columns from JSON
    let columnsArray: any[];
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        columnsArray = Object.keys(object[key]);
      }
    }
    //Add Data and Conditinal Formatting

    object.forEach((element: any) => {
      const eachRow = [];
      columnsArray.forEach((column) => {
        eachRow.push(element[column]);

      });

      if (element.isDeleted === 'Y') {
        const deleteRow = worksheet.addRow(eachRow);
        deleteRow.eachCell((cell) => {
          cell.font = { name: 'Times New Roman', family: 4, size: 11, bold: false, strike: true };
          cell.border = {
            top: { style: 'thin', color: { argb: '333333' } },
            left: { style: 'thin', color: { argb: '333333' } },
            bottom: { style: 'thin', color: { argb: '333333' } },
            right: { style: 'thin', color: { argb: '333333' } }
          };
        })
      } else {
        worksheet.addRow(eachRow);
      }
      //set with column to fit
      // worksheet.columns.forEach((column, columnIndex) => {
      //   let maxLength = 0;
      //   column.eachCell({ includeEmpty: true }, (cell) => {
      //     const cellLength = cell.value ? cell.value.toString().length : 0;
      //     maxLength = cellLength;
      //   });
      //   worksheet.getColumn(columnIndex + 2).width = maxLength + 2;
      // });
    });


    wb.xlsx.writeBuffer().then(buffer => {
      const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(data, 'VSAT-TNU('+ title +').xlsx' );
    });


  }
  setColWidth(ws, cols: {}) {
    Object.keys(cols).forEach((f, key) => {
      ws.getColumn(Number(f)).width = cols[f];
    })
  }
  setCellProperties(cell, sizeNumber, options) {
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { name: 'Times New Roman', size: sizeNumber, ...options };
  }
}
